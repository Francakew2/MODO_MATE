const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// 1. Crear preferencia de cobro (Usuario autenticado)
router.post('/create-preference', requireAuth, async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Falta especificar el ID del pedido.' });
  }

  try {
    // Obtener pedido de la base de datos para validar
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Pedido no encontrado en el sistema.' });
    }

    // Validar que el pedido pertenece al usuario autenticado
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para pagar este pedido.' });
    }

    const preference = new Preference(client);
    
    // Mapear los productos a items de Mercado Pago
    const items = order.items.map(item => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency_id: 'ARS'
    }));

    // Si hay costo de envío, lo agregamos como un item virtual de cobro
    if (order.shipping_cost > 0) {
      items.push({
        id: 'shipping_cost',
        title: 'Costo de Envío (Correo Argentino)',
        quantity: 1,
        unit_price: parseFloat(order.shipping_cost),
        currency_id: 'ARS'
      });
    }
    
    // Crear preferencia en Mercado Pago
    const result = await preference.create({
      body: {
        items,
        payer: {
          email: order.customer_email || req.user.email,
          name: order.customer_name
        },
        external_reference: order.id, // ID del pedido para asociarlo en el Webhook
        back_urls: {
          success: 'https://modomate1.com.ar/',
          failure: 'https://modomate1.com.ar/',
          pending: 'https://modomate1.com.ar/'
        },
        auto_return: 'approved',
        notification_url: 'https://modo-mate.onrender.com/api/payments/webhook' // URL en Render
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (err) {
    console.error('Error al crear preferencia de Mercado Pago:', err);
    res.status(500).json({ error: 'Error al generar la pasarela de pagos.' });
  }
});

// 2. Webhook (IPN) de Mercado Pago
router.post('/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  try {
    if (topic === 'payment') {
      const paymentId = query.id || query['data.id'];
      
      if (!paymentId) {
        return res.sendStatus(400);
      }

      // 1. Obtener detalles del pago desde la API oficial de Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      });

      if (!paymentResponse.ok) {
        throw new Error(`Error en API de Mercado Pago: ${paymentResponse.statusText}`);
      }

      const payment = await paymentResponse.json();

      if (payment.status === 'approved') {
        const orderId = payment.external_reference;

        // Validar si el pedido ya fue marcado como pagado (para evitar duplicados)
        const { data: order, error: findError } = await supabase
          .from('orders')
          .select('payment_status, items')
          .eq('id', orderId)
          .single();

        if (findError || !order) {
          throw new Error('Pedido no encontrado al procesar webhook');
        }

        if (order.payment_status !== 'approved') {
          // A) Actualizar el pedido en Supabase
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              payment_status: 'approved', 
              status: 'Preparando', 
              mp_payment_id: paymentId 
            })
            .eq('id', orderId);

          if (updateError) throw updateError;

          // B) Descontar el stock en Supabase
          for (const item of order.items) {
            // Obtener stock actual
            const { data: prod, error: prodErr } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.id)
              .single();

            if (!prodErr && prod) {
              const newStock = Math.max(0, prod.stock - item.quantity);
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
            }
          }

          // C) Notificación de WhatsApp al administrador
          const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
          if (adminPhone) {
            const messageText = encodeURIComponent(
              `🧉 *¡Nuevo pedido en MODO MATE!*\n\n` +
              `*ID Pedido:* #${orderId.slice(0, 8)}\n` +
              `*Cliente:* ${payment.payer.first_name || ''} ${payment.payer.last_name || ''}\n` +
              `*Monto Pagado:* $${payment.transaction_amount} ARS\n` +
              `*Forma de pago:* ${payment.payment_method_id.toUpperCase()}\n\n` +
              `Ingresá al panel administrativo para armar el pedido. ✨`
            );
            const waLink = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${messageText}`;
            console.log(`[ALERT] Notificación WhatsApp: ${waLink}`);
          }
        }
      }
    }
    
    // Responder siempre 200 o 201 a Mercado Pago para avisar que recibimos el webhook correctamente
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al procesar webhook de Mercado Pago:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
