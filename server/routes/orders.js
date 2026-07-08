const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 1. Obtener todos los pedidos (Solo Admin)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (err) {
    console.error('Error al obtener pedidos globales:', err);
    res.status(500).json({ error: 'Error al obtener los pedidos.' });
  }
});

// 2. Obtener los pedidos del usuario autenticado (Cliente)
router.get('/my-orders', requireAuth, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (err) {
    console.error('Error al obtener pedidos del usuario:', err);
    res.status(500).json({ error: 'Error al obtener tus pedidos.' });
  }
});

// 3. Crear un nuevo pedido (Usuario autenticado)
router.post('/', requireAuth, async (req, res) => {
  const { 
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_address, 
    customer_city, 
    customer_zip, 
    items, 
    shipping_cost 
  } = req.body;

  if (!customer_name || !items || items.length === 0) {
    return res.status(400).json({ error: 'Faltan datos del cliente o productos en el carrito.' });
  }

  try {
    // 1. Calcular el total del pedido en el servidor para evitar fraudes en el precio del frontend
    let subtotal = 0;
    
    // Validar formato UUID para evitar errores de casteo en PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIds = items.map(i => i.id).filter(id => uuidRegex.test(id));

    if (productIds.length === 0) {
      return res.status(400).json({ error: 'Ninguno de los productos en tu carrito está disponible en la base de datos actual.' });
    }

    // Obtener información de precios actuales de los productos cargados en el carrito
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, price, stock')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('Error Supabase al consultar productos:', dbError);
      throw new Error('Error al validar productos en la base de datos.');
    }

    const priceMap = {};
    const stockMap = {};
    dbProducts.forEach(p => {
      priceMap[p.id] = parseFloat(p.price);
      stockMap[p.id] = p.stock;
    });

    // Validar stock y sumar precios
    for (const item of items) {
      if (priceMap[item.id] === undefined) {
        return res.status(400).json({ error: `El producto "${item.name}" ya no está disponible en el catálogo de producción.` });
      }
      if (stockMap[item.id] < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${item.name}. Disponibles: ${stockMap[item.id]}` });
      }
      subtotal += priceMap[item.id] * item.quantity;
    }

    const shipCost = parseFloat(shipping_cost) || 0;
    const total = subtotal + shipCost;

    // 2. Insertar pedido en la base de datos
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user.id,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_city,
        customer_zip,
        items,
        subtotal,
        shipping_cost: shipCost,
        total,
        payment_method: 'Mercado Pago',
        payment_status: 'pending',
        status: 'Pendiente'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error al registrar pedido:', err);
    res.status(500).json({ error: err.message || 'Error al registrar el pedido.' });
  }
});

// 4. Actualizar el estado de un pedido (Solo Admin)
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Falta especificar el nuevo estado.' });
  }

  try {
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    res.status(500).json({ error: 'Error al actualizar el pedido.' });
  }
});

module.exports = router;
