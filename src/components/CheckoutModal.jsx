import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Phone } from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onClearCart,
  onAddOrder
}) {
  const [step, setStep] = useState(1); // 1: Form & Payment, 2: Success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: 'CABA',
    zipCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'transfer', 'card', 'mercadopago'
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });
  const [shippingCost, setShippingCost] = useState(3500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Auto-calculate shipping based on zip code
  useEffect(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal >= 95000) {
      setShippingCost(0);
    } else {
      const code = parseInt(formData.zipCode) || 0;
      // A) Santa Fe (Local)
      const isSantaFe = (code >= 2000 && code <= 2699) || (code >= 3000 && code <= 3099);
      
      // B) Regional
      const isRegional = 
        (code >= 1000 && code <= 1999) || // CABA y GBA
        (code >= 2700 && code <= 2999) || // Norte de Buenos Aires
        (code >= 3100 && code <= 3399) || // Entre Ríos y Misiones
        (code >= 3400 && code <= 3499) || // Corrientes
        (code >= 3500 && code <= 3799) || // Chaco, Formosa, Reconquista
        (code >= 5000 && code <= 5999) || // Córdoba y San Luis
        (code >= 6000 && code <= 8199);   // Interior de Buenos Aires
        
      if (isSantaFe) {
        setShippingCost(9900); // Provincial (Santa Fe)
      } else if (isRegional) {
        setShippingCost(11500); // Regional
      } else {
        setShippingCost(13000); // Nacional
      }
    }
  }, [formData.zipCode, cartItems]);

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= 75000;
  
  // Calculate final totals based on payment method
  const discountRate = paymentMethod === 'transfer' ? 0.1 : 0;
  const discountAmount = subtotal * discountRate;
  const finalTotal = subtotal - discountAmount + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatear entradas de tarjeta
    let formattedValue = value;
    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})/g, '$1/').trim().slice(0, 5);
      if (formattedValue.endsWith('/')) formattedValue = formattedValue.slice(0, 2);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address || !formData.phone) {
      alert('Por favor completa todos los datos de envío obligatorios.');
      return;
    }

    if (paymentMethod === 'card') {
      if (cardData.number.replace(/\s/g, '').length < 16 || !cardData.name || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
        alert('Por favor completa los datos de la tarjeta correctamente.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Estructurar los datos para la llamada a la API
      const orderPayload = {
        customer: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city} (${formData.province})`,
        customerCity: formData.city,
        customerZip: formData.zipCode,
        shippingCost: shippingCost,
        paymentMethodType: paymentMethod // 'transfer' | 'card' | 'mercadopago'
      };

      const resultOrder = await onAddOrder(orderPayload);

      if (resultOrder) {
        // Si el pago es por Mercado Pago, la página redirige automáticamente en App.jsx,
        // por lo que no hace falta avanzar al step 2 aquí.
        if (paymentMethod !== 'mercadopago') {
          setOrderId(resultOrder.id);
          setStep(2);
        }
      }
    } catch (err) {
      console.error('Error al confirmar compra:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    onClearCart();
    onClose();
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: 'CABA',
      zipCode: ''
    });
    setCardData({
      number: '',
      name: '',
      expiry: '',
      cvv: '',
      installments: '1'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={step === 1 && !isProcessing ? onClose : undefined}
        className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-fade-in">
        
        {step === 1 ? (
          <>
            {/* Left: Shipping Form & Payments */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-arena">
                <div>
                  <h2 className="text-xl font-black text-brand-dark">Finalizar Compra</h2>
                  <p className="text-xs text-brand-gray">Ingresá tus datos para coordinar el envío y pago.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="p-1 rounded-full hover:bg-brand-arena text-brand-gray transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Shipping Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">1. Datos de Envío</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Nombre Completo *</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="juan@email.com"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="11 3456-7890"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Dirección (Calle y Altura) *</label>
                    <input 
                      type="text" 
                      name="address" 
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Av. Santa Fe 3400, Piso 3 A"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Ciudad / Localidad *</label>
                    <input 
                      type="text" 
                      name="city" 
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Palermo"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Provincia</label>
                    <select 
                      name="province" 
                      value={formData.province}
                      onChange={handleInputChange}
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    >
                      <option value="CABA">Capital Federal (CABA)</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Entre Ríos">Entre Ríos</option>
                      <option value="Corrientes">Corrientes</option>
                      <option value="Chaco">Chaco</option>
                      <option value="Santiago del Estero">Santiago del Estero</option>
                      <option value="La Pampa">La Pampa</option>
                      <option value="Catamarca">Catamarca</option>
                      <option value="Chubut">Chubut</option>
                      <option value="Formosa">Formosa</option>
                      <option value="Jujuy">Jujuy</option>
                      <option value="La Rioja">La Rioja</option>
                      <option value="Mendoza">Mendoza</option>
                      <option value="Misiones">Misiones</option>
                      <option value="Neuquén">Neuquén</option>
                      <option value="Río Negro">Río Negro</option>
                      <option value="Salta">Salta</option>
                      <option value="San Juan">San Juan</option>
                      <option value="San Luis">San Luis</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="Tierra del Fuego">Tierra del Fuego</option>
                      <option value="Tucumán">Tucumán</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">Código Postal (4 dígitos) *</label>
                    <input 
                      type="text" 
                      name="zipCode" 
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="1425"
                      className="w-full bg-brand-arena/40 border border-transparent rounded-xl px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Selector */}
              <div className="space-y-4 pt-4 border-t border-brand-arena">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">2. Método de Pago</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* Transfer option */}
                  <label className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center cursor-pointer ${
                    paymentMethod === 'transfer' 
                      ? 'border-brand-green bg-brand-green-light/40 text-brand-green-dark' 
                      : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                  }`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="transfer" 
                      checked={paymentMethod === 'transfer'} 
                      onChange={() => setPaymentMethod('transfer')}
                      className="sr-only"
                    />
                    <Landmark className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold leading-tight">Transferencia<br /><span className="text-[10px] text-green-600 font-black">10% OFF</span></span>
                  </label>

                  {/* Card option */}
                  <label className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center cursor-pointer ${
                    paymentMethod === 'card' 
                      ? 'border-brand-green bg-brand-green-light/40 text-brand-green-dark' 
                      : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                  }`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')}
                      className="sr-only"
                    />
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold leading-tight">Tarjeta<br /><span className="text-[10px] text-brand-gold font-bold">Hasta 3 Cuotas</span></span>
                  </label>

                  {/* Mercado Pago option */}
                  <label className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center cursor-pointer ${
                    paymentMethod === 'mercadopago' 
                      ? 'border-[#009EE3] bg-[#009EE3]/5 text-[#009EE3]' 
                      : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                  }`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="mercadopago" 
                      checked={paymentMethod === 'mercadopago'} 
                      onChange={() => setPaymentMethod('mercadopago')}
                      className="sr-only"
                    />
                    {/* SVG simplificado de Mercado Pago o icono */}
                    <div className="w-5 h-5 mb-1 bg-[#009EE3] text-white rounded-full flex items-center justify-center text-[10px] font-black italic">MP</div>
                    <span className="text-xs font-bold leading-tight">Mercado Pago<br /><span className="text-[10px] text-[#009EE3] font-bold">Rápido</span></span>
                  </label>
                </div>

                {/* Conditional Payment Forms */}
                <div className="p-4 bg-brand-arena/20 rounded-2xl border border-brand-arena">
                  {paymentMethod === 'transfer' && (
                    <div className="text-xs space-y-2 text-brand-dark/90">
                      <p className="font-bold text-brand-green-dark text-sm">💰 Detalles de Transferencia:</p>
                      <p>Aboná en nuestra cuenta con un <strong>10% de descuento inmediato</strong>.</p>
                      <div className="bg-white p-3 rounded-xl border border-brand-arena font-mono space-y-1">
                        <p><strong>Banco:</strong> Banco Galicia</p>
                        <p><strong>Titular:</strong> MODO MATE S.H.</p>
                        <p><strong>Alias:</strong> MODO.MATE.GALICIA</p>
                        <p><strong>CBU:</strong> 0070123420000004567890</p>
                      </div>
                      <p className="text-brand-gray italic">(*) Al confirmar el pedido, te enviaremos por WhatsApp los datos. Deberás enviar el comprobante para despachar tu envío.</p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <p className="font-bold text-brand-green-dark text-xs uppercase tracking-wider">💳 Datos de la Tarjeta</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-brand-dark mb-0.5">Número de Tarjeta</label>
                          <input 
                            type="text" 
                            name="number"
                            value={cardData.number}
                            onChange={handleCardInputChange}
                            placeholder="4517 5683 9200 4812"
                            className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-brand-dark mb-0.5">Nombre del Titular (como figura en la tarjeta)</label>
                          <input 
                            type="text" 
                            name="name"
                            value={cardData.name}
                            onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                            placeholder="JUAN PEREZ"
                            className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-brand-dark mb-0.5">Vencimiento (MM/AA)</label>
                          <input 
                            type="text" 
                            name="expiry"
                            value={cardData.expiry}
                            onChange={handleCardInputChange}
                            placeholder="12/28"
                            className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-brand-dark mb-0.5">CVV (3-4 dígitos)</label>
                          <input 
                            type="password" 
                            name="cvv"
                            value={cardData.cvv}
                            onChange={handleCardInputChange}
                            placeholder="***"
                            className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green text-center"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-brand-dark mb-0.5">Cuotas</label>
                          <select 
                            name="installments" 
                            value={cardData.installments}
                            onChange={(e) => setCardData(prev => ({ ...prev, installments: e.target.value }))}
                            className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
                          >
                            <option value="1">1 cuota sin interés de {formatPrice(finalTotal)}</option>
                            <option value="3">3 cuotas sin interés de {formatPrice(finalTotal / 3)}</option>
                            <option value="6">6 cuotas de {formatPrice((finalTotal * 1.15) / 6)} (15% recargo)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'mercadopago' && (
                    <div className="text-xs space-y-2 text-[#009EE3]">
                      <p className="font-bold text-sm">⚡ Checkout de Mercado Pago:</p>
                      <p className="text-brand-dark">Serás redirigido a la ventana segura de Mercado Pago para procesar tu pago de forma instantánea mediante saldo en cuenta, débito o dinero en efectivo.</p>
                      <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-2 rounded-lg text-[10px]">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Transacción protegida por cifrado SSL oficial de Mercado Pago.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-brand-arena">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 bg-brand-arena hover:bg-brand-gray/25 text-brand-dark font-bold py-2.5 rounded-xl text-sm"
                >
                  Volver al Carrito
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Compra</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right: Summary panel */}
            <div className="w-full md:w-[350px] bg-brand-arena/30 border-t md:border-t-0 md:border-l border-brand-arena p-6 md:p-8 flex flex-col justify-between max-h-none md:max-h-full overflow-y-auto shrink-0">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark">Resumen del Pedido</h3>
                
                {/* Cart items preview list */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-brand-arena bg-brand-arena shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-brand-dark truncate">{item.name}</h4>
                        <span className="text-[10px] text-brand-gray">Cant: {item.quantity}</span>
                      </div>
                      <span className="font-bold text-brand-dark">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotals breakdown */}
                <div className="space-y-2 pt-4 border-t border-brand-arena text-xs">
                  <div className="flex justify-between text-brand-gray">
                    <span>Subtotal:</span>
                    <span className="font-bold text-brand-dark">{formatPrice(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento (10% Transferencia):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-brand-gray">
                    <span>Costo de Envío:</span>
                    <span className={shippingCost === 0 ? "text-green-600 font-bold" : "text-brand-dark"}>
                      {shippingCost === 0 ? "¡Gratis!" : formatPrice(shippingCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-brand-dark pt-3 border-t border-brand-arena">
                    <span>Total a Pagar:</span>
                    <span className="text-base text-brand-green-dark">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Safety Badges */}
              <div className="mt-8 pt-4 border-t border-brand-arena text-[10px] text-brand-gray flex flex-col gap-2 bg-white/40 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <span className="font-bold">Pago 100% Protegido</span>
                </div>
                <p className="leading-normal">Esta es una simulación de pago para demostración. No se debitará dinero real ni se realizarán envíos de mercadería física.</p>
              </div>
            </div>
          </>
        ) : (
          /* Step 2: Success page */
          <div className="flex-1 p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto gap-6 animate-scale-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-brand-dark">¡Compra Confirmada!</h2>
              <p className="text-sm text-brand-gray mt-1.5">Tu pedido ha sido recibido con éxito en nuestro local.</p>
              <div className="bg-brand-arena/40 text-brand-green-dark border border-brand-green/20 inline-block px-4 py-1.5 rounded-full font-mono text-sm font-bold mt-3">
                Pedido: {orderId}
              </div>
            </div>

            <div className="bg-brand-arena/20 border border-brand-arena rounded-2xl p-5 text-xs text-left w-full space-y-3">
              <p className="font-bold text-brand-dark text-sm border-b border-brand-arena pb-1">¿Cómo sigue tu pedido?</p>
              {paymentMethod === 'transfer' ? (
                <div className="space-y-3">
                  <p className="text-brand-dark">
                    👉 <strong>Envíanos el comprobante:</strong> Realizá la transferencia al CBU indicado anteriormente por el total de <strong>{formatPrice(finalTotal)}</strong> y envianos una captura del comprobante a nuestro WhatsApp <strong>+54 9 3408 67-1408</strong> indicando tu número de pedido ({orderId}).
                  </p>
                  <a 
                    href={`https://wa.me/5493408671408?text=Hola!%20Acabo%20de%20hacer%20un%20pedido%20con%20el%20ID%20%23${orderId.slice(0, 8)}.%20Acá%20está%20el%20comprobante%20de%20la%20transferencia.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20BA56] text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>
                </div>
              ) : paymentMethod === 'card' ? (
                <p className="text-brand-dark">
                  💳 <strong>Pago Procesado:</strong> Tu pago en {cardData.installments} cuotas ha sido aprobado correctamente. En las próximas 24 horas hábiles armaremos tu pedido para despacharlo a la dirección <strong>{formData.address}</strong>.
                </p>
              ) : (
                <p className="text-brand-dark">
                  ⚡ <strong>Aprobado por Mercado Pago:</strong> Tu pago instantáneo fue procesado con éxito. Pronto recibirás un correo electrónico de confirmación de envío con el código de seguimiento.
                </p>
              )}
              <p className="text-brand-gray italic">Te enviamos una simulación del resumen a tu email: <strong>{formData.email}</strong>.</p>
            </div>

            <button
              onClick={handleFinish}
              className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-brand-green/20 w-full transition-transform hover:scale-105"
            >
              Volver a la Tienda
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
