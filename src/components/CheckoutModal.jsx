import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Phone, Truck, Store, MapPin, Mail, ChevronRight, User } from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onClearCart,
  onAddOrder
}) {
  const [step, setStep] = useState(1); // 1: Datos de Contacto y Entrega, 2: Pago, 3: Éxito
  const [deliveryMethod, setDeliveryMethod] = useState('home'); // 'home' | 'branch' | 'pickup'
  const [shippingType, setShippingType] = useState('classic'); // 'classic' | 'expreso'
  
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    dniCuil: '',
    address: '',
    floorDept: '',
    city: '',
    province: 'CABA',
    zipCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'transfer' | 'card' | 'mercadopago'
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });

  const [shippingCost, setShippingCost] = useState(9900);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Auto-calculate shipping based on zip code, delivery method and shipping type
  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setShippingCost(0);
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const code = parseInt(formData.zipCode) || 0;
    
    // A) Santa Fe (Provincial)
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

    let baseRate = 13000;
    if (deliveryMethod === 'branch') {
      baseRate = 9900;
      if (isSantaFe) baseRate = 6900;
      else if (isRegional) baseRate = 8500;
    } else {
      baseRate = 13000;
      if (isSantaFe) baseRate = 9900;
      else if (isRegional) baseRate = 11500;
    }

    // Free shipping threshold check (classic/branch only)
    if (subtotal >= 95000) {
      if (deliveryMethod === 'branch' || shippingType === 'classic') {
        setShippingCost(0);
      } else {
        setShippingCost(4400); // Expreso has a reduced surcharge if subtotal >= 95k
      }
    } else {
      if (deliveryMethod === 'branch' || shippingType === 'classic') {
        setShippingCost(baseRate);
      } else {
        setShippingCost(baseRate + 4400); // Expreso has $4.400 surcharge
      }
    }
  }, [formData.zipCode, deliveryMethod, shippingType, cartItems]);

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
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
    
    let formattedValue = value;
    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})/g, '$1/').trim().slice(0, 5);
      if (formattedValue.endsWith('/')) formattedValue = formattedValue.slice(0, 2);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g).slice(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    
    // Validar Datos de Contacto y destinatario
    if (!formData.email || !formData.name || !formData.lastName || !formData.phone || !formData.dniCuil) {
      alert('Por favor, completa todos los campos de contacto y del destinatario.');
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // Si es a domicilio o sucursal, validar campos de dirección
    if (deliveryMethod === 'home') {
      if (!formData.address || !formData.city || !formData.zipCode) {
        alert('Por favor, completa los datos de tu dirección de entrega.');
        return;
      }
      if (formData.zipCode.length < 4) {
        alert('Por favor, ingresa un código postal válido de 4 dígitos.');
        return;
      }
    } else if (deliveryMethod === 'branch') {
      if (!formData.city || !formData.zipCode) {
        alert('Por favor, completa la localidad y código postal para el envío a sucursal.');
        return;
      }
      if (formData.zipCode.length < 4) {
        alert('Por favor, ingresa un código postal válido de 4 dígitos.');
        return;
      }
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      if (cardData.number.replace(/\s/g, '').length < 16 || !cardData.name || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
        alert('Por favor, completa los datos de tu tarjeta correctamente.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Estructurar los datos para la llamada a la API
      let fullAddress = '';
      if (deliveryMethod === 'home') {
        fullAddress = `${formData.address}${formData.floorDept ? ' ' + formData.floorDept : ''}, ${formData.city} (${formData.province})`;
      } else if (deliveryMethod === 'branch') {
        fullAddress = `Envío a Sucursal Correo Argentino: Localidad: ${formData.city} (${formData.province}) - CP: ${formData.zipCode}${formData.floorDept ? ' (Pref: ' + formData.floorDept + ')' : ''}`;
      } else {
        fullAddress = 'Retiro en Local: Bv. San Martín 1121, San Cristóbal, Santa Fe';
      }

      const orderPayload = {
        customer: `${formData.name} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: fullAddress,
        customerCity: deliveryMethod !== 'pickup' ? formData.city : 'San Cristóbal',
        customerZip: deliveryMethod !== 'pickup' ? formData.zipCode : '3070',
        shippingCost: shippingCost,
        paymentMethodType: paymentMethod
      };

      const resultOrder = await onAddOrder(orderPayload);

      if (resultOrder) {
        if (paymentMethod !== 'mercadopago') {
          setOrderId(resultOrder.id);
          setStep(3);
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
    setDeliveryMethod('home');
    setShippingType('classic');
    setFormData({
      name: '',
      lastName: '',
      email: '',
      phone: '',
      dniCuil: '',
      address: '',
      floorDept: '',
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
        onClick={step !== 3 && !isProcessing ? onClose : undefined}
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Card Container */}
      <div className="relative bg-white border border-brand-arena w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-scale-up z-10">
        
        {step !== 3 ? (
          <>
            {/* LEFT: Checkout Wizard Form (Scrollable) */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-arena">
                <div>
                  <h2 className="text-xl font-bold tracking-wider text-brand-dark uppercase">Checkout</h2>
                  <p className="text-xs text-brand-gray">Completá los pasos para finalizar tu compra.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="p-1.5 hover:bg-brand-arena text-brand-gray transition-all rounded-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps Tracker */}
              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gray pb-4 border-b border-brand-arena">
                <span className="flex items-center gap-1.5 text-brand-green-dark">
                  <span className="w-5 h-5 bg-brand-green/20 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span>Carrito</span>
                </span>
                <span className="h-[1px] w-8 bg-brand-arena" />
                
                <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-brand-dark font-black' : 'text-brand-green-dark'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-brand-dark text-white' : 'bg-brand-green/20 text-brand-green-dark'}`}>
                    {step > 1 ? '✓' : '1'}
                  </span>
                  <span>Entrega</span>
                </span>
                <span className="h-[1px] w-8 bg-brand-arena" />
                
                <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-brand-dark font-black' : 'text-brand-gray'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-brand-dark text-white' : 'bg-brand-arena text-brand-gray'}`}>
                    2
                  </span>
                  <span>Pago</span>
                </span>
              </div>

              {/* STEP 1: CONTACTO Y ENTREGA */}
              {step === 1 && (
                <form onSubmit={handleContinueToPayment} className="space-y-6 flex-1">
                  
                  {/* Datos de Contacto */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-green-dark font-bold text-xs uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-brand-gold" />
                      <span>Datos de Contacto</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">E-mail *</label>
                      <input 
                        type="email" 
                        name="email" 
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="ejemplo@correo.com"
                        className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  {/* Método de Entrega */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-brand-green-dark font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-brand-gold" />
                      <span>Método de Entrega</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Domicilio */}
                      <label className={`flex flex-col items-center justify-center p-3 border cursor-pointer transition-all text-center ${
                        deliveryMethod === 'home' 
                          ? 'border-brand-dark bg-brand-arena/20 text-brand-dark font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray bg-white'
                      }`}>
                        <input 
                          type="radio" 
                          name="deliveryMethod" 
                          value="home" 
                          checked={deliveryMethod === 'home'} 
                          onChange={() => setDeliveryMethod('home')}
                          className="sr-only"
                        />
                        <Truck className="w-5 h-5 mb-1.5 text-brand-gold" />
                        <span className="text-[10px] uppercase tracking-wider">A Domicilio</span>
                        <span className="text-[8px] text-brand-gray font-normal lowercase mt-0.5">Correo Argentino</span>
                      </label>

                      {/* Sucursal */}
                      <label className={`flex flex-col items-center justify-center p-3 border cursor-pointer transition-all text-center ${
                        deliveryMethod === 'branch' 
                          ? 'border-brand-dark bg-brand-arena/20 text-brand-dark font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray bg-white'
                      }`}>
                        <input 
                          type="radio" 
                          name="deliveryMethod" 
                          value="branch" 
                          checked={deliveryMethod === 'branch'} 
                          onChange={() => setDeliveryMethod('branch')}
                          className="sr-only"
                        />
                        <Truck className="w-5 h-5 mb-1.5 text-brand-green-dark" />
                        <span className="text-[10px] uppercase tracking-wider">A Sucursal</span>
                        <span className="text-[8px] text-brand-gray font-normal lowercase mt-0.5">más económico</span>
                      </label>

                      {/* Local */}
                      <label className={`flex flex-col items-center justify-center p-3 border cursor-pointer transition-all text-center ${
                        deliveryMethod === 'pickup' 
                          ? 'border-brand-dark bg-brand-arena/20 text-brand-dark font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray bg-white'
                      }`}>
                        <input 
                          type="radio" 
                          name="deliveryMethod" 
                          value="pickup" 
                          checked={deliveryMethod === 'pickup'} 
                          onChange={() => setDeliveryMethod('pickup')}
                          className="sr-only"
                        />
                        <Store className="w-5 h-5 mb-1.5 text-brand-gold" />
                        <span className="text-[10px] uppercase tracking-wider">Retiro Local</span>
                        <span className="text-[8px] text-brand-gray font-normal lowercase mt-0.5">sin costo</span>
                      </label>
                    </div>
                  </div>

                  {/* Detalle según método de envío */}
                  {deliveryMethod !== 'pickup' ? (
                    <div className="space-y-4 bg-brand-arena/10 p-4 border border-brand-arena">
                      
                      {/* Ubicación y opciones Correo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1">Código Postal *</label>
                          <input 
                            type="text" 
                            name="zipCode" 
                            required
                            value={formData.zipCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            placeholder="3070"
                            className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                          />
                        </div>

                        {formData.zipCode && (
                          <div className="sm:col-span-2 space-y-2">
                            {deliveryMethod === 'home' ? (
                              <>
                                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Opciones de Envío (Correo Argentino)</label>
                                
                                {/* Clásico */}
                                <label className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                                  shippingType === 'classic' ? 'border-brand-dark bg-white font-bold' : 'border-brand-arena bg-white hover:border-brand-gray'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="radio" 
                                      name="shippingType" 
                                      value="classic" 
                                      checked={shippingType === 'classic'}
                                      onChange={() => setShippingType('classic')}
                                      className="text-brand-green focus:ring-0"
                                    />
                                    <div className="text-xs text-brand-dark">
                                      <p className="font-bold">Correo Argentino Clásico</p>
                                      <p className="text-[10px] text-brand-gray font-normal">Llega entre 3 y 5 días hábiles a domicilio.</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-brand-dark">
                                    {shippingCost === 0 && shippingType === 'classic' ? 'Gratis' : formatPrice(shippingCost - (shippingType === 'expreso' ? 4400 : 0))}
                                  </span>
                                </label>

                                {/* Expreso */}
                                <label className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                                  shippingType === 'expreso' ? 'border-brand-dark bg-white font-bold' : 'border-brand-arena bg-white hover:border-brand-gray'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="radio" 
                                      name="shippingType" 
                                      value="expreso" 
                                      checked={shippingType === 'expreso'}
                                      onChange={() => setShippingType('expreso')}
                                      className="text-brand-green focus:ring-0"
                                    />
                                    <div className="text-xs text-brand-dark">
                                      <p className="font-bold">Correo Argentino Expreso</p>
                                      <p className="text-[10px] text-brand-gray font-normal">Llega entre 1 y 2 días hábiles a domicilio.</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-brand-dark">
                                    {formatPrice((shippingCost === 4400 && shippingType === 'expreso' ? 4400 : shippingCost) + (shippingType === 'classic' ? 4400 : 0))}
                                  </span>
                                </label>
                              </>
                            ) : (
                              <>
                                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Costo de Envío a Sucursal Correo Argentino</label>
                                <div className="bg-white p-3 border border-brand-arena text-xs flex justify-between items-center font-bold">
                                  <span className="text-brand-gray font-normal">Envío Estándar a Sucursal:</span>
                                  <span className={shippingCost === 0 ? "text-green-600 font-extrabold" : "text-brand-dark"}>
                                    {shippingCost === 0 ? "¡Gratis!" : formatPrice(shippingCost)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-brand-gray font-medium">✓ Se enviará a la sucursal de Correo Argentino más cercana a tu localidad. Luego coordinaremos los detalles exactos por WhatsApp.</p>
                              </>
                            )}

                          </div>
                        )}
                      </div>

                      {/* Datos del Destinatario */}
                      <div className="space-y-3 pt-2 border-t border-brand-arena">
                        <div className="flex items-center gap-2 text-brand-dark font-bold text-xs uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Datos del Destinatario</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Nombre *</label>
                            <input 
                              type="text" 
                              name="name" 
                              required
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Juan"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Apellido *</label>
                            <input 
                              type="text" 
                              name="lastName" 
                              required
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="Pérez"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Teléfono *</label>
                            <input 
                              type="tel" 
                              name="phone" 
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="3408 67-1408"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">DNI / CUIL *</label>
                            <input 
                              type="text" 
                              name="dniCuil" 
                              required
                              value={formData.dniCuil}
                              onChange={(e) => setFormData(prev => ({ ...prev, dniCuil: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                              placeholder="20-34567890-9"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dirección de Entrega */}
                      <div className="space-y-3 pt-2 border-t border-brand-arena">
                        <div className="flex items-center gap-2 text-brand-dark font-bold text-xs uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{deliveryMethod === 'home' ? 'Dirección de Destino' : 'Localidad de Destino'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {deliveryMethod === 'home' ? (
                            <>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Calle y Altura *</label>
                                <input 
                                  type="text" 
                                  name="address" 
                                  required
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  placeholder="Av. Rivadavia 1234"
                                  className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Piso / Dpto (Opcional)</label>
                                <input 
                                  type="text" 
                                  name="floorDept" 
                                  value={formData.floorDept}
                                  onChange={handleInputChange}
                                  placeholder="Piso 2 Depto B"
                                  className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Sucursal Preferida o Comentarios (Opcional)</label>
                              <input 
                                type="text" 
                                name="floorDept" 
                                value={formData.floorDept}
                                onChange={handleInputChange}
                                placeholder="ej: Sucursal Centro / cerca de la plaza principal"
                                className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Ciudad / Localidad *</label>
                            <input 
                              type="text" 
                              name="city" 
                              required
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="San Cristóbal"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Provincia</label>
                            <select 
                              name="province" 
                              value={formData.province}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
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
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Retirar por local */
                    <div className="space-y-4 bg-brand-arena/10 p-4 border border-brand-arena">
                      
                      {/* Sucursal info */}
                      <div className="flex items-start gap-3 bg-white p-4 border border-brand-arena">
                        <MapPin className="w-5 h-5 text-brand-green-dark shrink-0 mt-0.5" />
                        <div className="text-xs text-brand-dark space-y-1">
                          <p className="font-bold uppercase tracking-wider">Local Oficial MODO MATE</p>
                          <p className="font-medium text-brand-gray">Bv. San Martín 1121, San Cristóbal, Santa Fe</p>
                          <p className="text-[10px] text-brand-gold font-bold">Lunes a Viernes: Mañana: 9:00 - 11:30 | Tarde: 17:00 - 20:00 hs</p>
                          <p className="text-[10px] text-brand-gold font-bold">Sábados: Mañana: 9:00 - 12:00 | Tarde: 18:00 - 20:30 hs</p>
                          <p className="text-[10px] text-brand-gold font-bold">Domingos: Cerrado</p>
                          <p className="text-green-600 font-bold mt-1">✓ Retiro inmediato: Gratis</p>
                        </div>
                      </div>

                      {/* Datos de Retiro (Destinatario) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-brand-dark font-bold text-xs uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Datos de quien retira</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Nombre *</label>
                            <input 
                              type="text" 
                              name="name" 
                              required
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Juan"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Apellido *</label>
                            <input 
                              type="text" 
                              name="lastName" 
                              required
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="Pérez"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Teléfono *</label>
                            <input 
                              type="tel" 
                              name="phone" 
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="3408 67-1408"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">DNI / CUIL *</label>
                            <input 
                              type="text" 
                              name="dniCuil" 
                              required
                              value={formData.dniCuil}
                              onChange={(e) => setFormData(prev => ({ ...prev, dniCuil: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                              placeholder="20-34567890-9"
                              className="w-full bg-white border border-brand-arena px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Navigation Buttons Step 1 */}
                  <div className="flex items-center gap-3 pt-4 border-t border-brand-arena">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-brand-arena hover:bg-brand-gray/25 text-brand-dark font-bold py-2.5 rounded-none text-xs uppercase tracking-wider"
                    >
                      Volver al Carrito
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-dark hover:bg-brand-green text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span>Continuar al Pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              )}

              {/* STEP 2: MEDIO DE PAGO */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                  
                  {/* Selector Medios de Pago */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-green-dark font-bold text-xs uppercase tracking-wider">
                      <CreditCard className="w-4 h-4 text-brand-gold" />
                      <span>Medios de Pago</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      
                      {/* Transferencia */}
                      <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                        paymentMethod === 'transfer' 
                          ? 'border-brand-dark bg-brand-arena/20 text-brand-dark font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="transfer" 
                            checked={paymentMethod === 'transfer'} 
                            onChange={() => setPaymentMethod('transfer')}
                            className="sr-only"
                          />
                          <Landmark className="w-5 h-5 shrink-0" />
                          <div className="text-left text-xs">
                            <p className="font-bold uppercase tracking-wider">Transferencia Bancaria</p>
                            <p className="text-[10px] text-green-600 font-bold">10% de Descuento Inmediato</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-brand-dark">{formatPrice(subtotal * 0.9)}</span>
                      </label>

                      {/* Tarjeta */}
                      <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-brand-dark bg-brand-arena/20 text-brand-dark font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="card" 
                            checked={paymentMethod === 'card'} 
                            onChange={() => setPaymentMethod('card')}
                            className="sr-only"
                          />
                          <CreditCard className="w-5 h-5 shrink-0" />
                          <div className="text-left text-xs">
                            <p className="font-bold uppercase tracking-wider">Tarjeta de Crédito o Débito</p>
                            <p className="text-[10px] text-brand-gold font-bold">Hasta 3 Cuotas sin interés</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-brand-dark">{formatPrice(subtotal)}</span>
                      </label>

                      {/* Mercado Pago */}
                      <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                        paymentMethod === 'mercadopago' 
                          ? 'border-[#009EE3] bg-[#009EE3]/5 text-[#009EE3] font-bold' 
                          : 'border-brand-arena hover:border-brand-gray text-brand-gray'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="mercadopago" 
                            checked={paymentMethod === 'mercadopago'} 
                            onChange={() => setPaymentMethod('mercadopago')}
                            className="sr-only"
                          />
                          <div className="w-5 h-5 bg-[#009EE3] text-white rounded-full flex items-center justify-center text-[10px] font-black italic shrink-0">MP</div>
                          <div className="text-left text-xs">
                            <p className="font-bold uppercase tracking-wider">Mercado Pago</p>
                            <p className="text-[10px] text-brand-gray">Pago instantáneo seguro</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold">{formatPrice(subtotal)}</span>
                      </label>

                    </div>
                  </div>

                  {/* Formularios condicionales según pago */}
                  <div className="p-4 bg-brand-arena/20 border border-brand-arena">
                    {paymentMethod === 'transfer' && (
                      <div className="text-xs space-y-2.5 text-brand-dark/90">
                        <p className="font-bold text-brand-green-dark text-sm uppercase tracking-wider">💰 Cuentas de Transferencia:</p>
                        <p>Realizá la transferencia por el total final a la siguiente cuenta oficial:</p>
                        <div className="bg-white p-3 border border-brand-arena font-mono space-y-1">
                          <p><strong>Banco:</strong> Banco Galicia</p>
                          <p><strong>Titular:</strong> MODO MATE S.H.</p>
                          <p><strong>Alias:</strong> MODO.MATE.GALICIA</p>
                          <p><strong>CBU:</strong> 0070123420000004567890</p>
                        </div>
                        <p className="text-brand-gray italic font-medium">(*) Una vez finalizado el pedido, tendrás que hacer clic en el botón de WhatsApp para enviarnos el comprobante de transferencia.</p>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <p className="font-bold text-brand-green-dark text-xs uppercase tracking-wider">💳 Datos de la Tarjeta</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-0.5">Número de Tarjeta</label>
                            <input 
                              type="text" 
                              name="number"
                              required
                              value={cardData.number}
                              onChange={handleCardInputChange}
                              placeholder="4517 5683 9200 4812"
                              className="w-full bg-white border border-brand-arena px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-0.5">Nombre del Titular</label>
                            <input 
                              type="text" 
                              name="name"
                              required
                              value={cardData.name}
                              onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                              placeholder="JUAN PEREZ"
                              className="w-full bg-white border border-brand-arena px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-0.5">Vencimiento</label>
                            <input 
                              type="text" 
                              name="expiry"
                              required
                              value={cardData.expiry}
                              onChange={handleCardInputChange}
                              placeholder="12/28"
                              className="w-full bg-white border border-brand-arena px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-0.5">CVV</label>
                            <input 
                              type="password" 
                              name="cvv"
                              required
                              value={cardData.cvv}
                              onChange={handleCardInputChange}
                              placeholder="***"
                              className="w-full bg-white border border-brand-arena px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-0.5">Cuotas</label>
                            <select 
                              name="installments" 
                              value={cardData.installments}
                              onChange={(e) => setCardData(prev => ({ ...prev, installments: e.target.value }))}
                              className="w-full bg-white border border-brand-arena px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-green"
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
                        <p className="font-bold text-sm uppercase tracking-wider">⚡ Redirección a Mercado Pago:</p>
                        <p className="text-brand-dark font-medium">Al confirmar, serás redirigido a la pasarela oficial de Mercado Pago para abonar de forma segura y acreditación inmediata.</p>
                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-2 border border-green-200 text-[10px]">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Pago protegido por encriptación SSL oficial.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons Step 2 */}
                  <div className="flex items-center gap-3 pt-4 border-t border-brand-arena">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isProcessing}
                      className="flex-1 bg-brand-arena hover:bg-brand-gray/25 text-brand-dark font-bold py-2.5 rounded-none text-xs uppercase tracking-wider"
                    >
                      Volver a Entrega
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest flex items-center justify-center gap-2"
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
              )}

            </div>

            {/* RIGHT: PERSISTENT ORDER SUMMARY SIDEBAR */}
            <div className="w-full md:w-[320px] bg-brand-arena/20 border-t md:border-t-0 md:border-l border-brand-arena p-6 md:p-8 flex flex-col justify-between max-h-none md:max-h-full overflow-y-auto shrink-0">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-dark border-b border-brand-arena pb-2">Resumen de Compra</h3>
                
                {/* Items previews */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-brand-arena bg-white shrink-0 rounded-none" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-brand-dark truncate">{item.name}</h4>
                        <span className="text-[10px] text-brand-gray">Cant: {item.quantity}</span>
                      </div>
                      <span className="font-bold text-brand-dark">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotals breakdowns */}
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
                    <span>Envío:</span>
                    <span className={shippingCost === 0 ? "text-green-600 font-bold" : "text-brand-dark font-bold"}>
                      {shippingCost === 0 ? "¡Gratis!" : formatPrice(shippingCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-brand-dark pt-3 border-t border-brand-arena">
                    <span>Total Final:</span>
                    <span className="text-base text-brand-green-dark">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="mt-8 pt-4 border-t border-brand-arena text-[9px] text-brand-gray flex flex-col gap-2 bg-white/60 p-3 border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green-dark" />
                  <span className="font-bold uppercase tracking-wider text-brand-dark">Compra Segura Garantizada</span>
                </div>
                <p className="leading-normal font-medium">Esta tienda oficial procesa de forma cifrada todas sus conexiones bancarias y pasarelas de pago de Mercado Pago.</p>
              </div>
            </div>
          </>
        ) : (
          /* STEP 3: SUCCESS CONFIRMATION PAGE */
          <div className="flex-1 p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto gap-6 animate-scale-up">
            <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 flex items-center justify-center rounded-none">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wider text-brand-dark">¡Pedido Confirmado!</h2>
              <p className="text-xs text-brand-gray mt-1.5 font-medium">Hemos registrado tu pedido exitosamente en nuestro sistema.</p>
              <div className="bg-brand-arena/40 text-brand-green-dark border border-brand-green/20 inline-block px-4 py-1.5 font-mono text-xs font-bold mt-3">
                Orden: #{orderId.slice(0, 8).toUpperCase()}
              </div>
            </div>

            <div className="bg-brand-arena/20 border border-brand-arena p-5 text-xs text-left w-full space-y-3 rounded-none">
              <p className="font-bold text-brand-dark text-xs uppercase tracking-wider border-b border-brand-arena pb-1">¿Cómo continúa tu entrega?</p>
              
              {paymentMethod === 'transfer' ? (
                <div className="space-y-3">
                  <p className="text-brand-dark font-medium leading-relaxed">
                    👉 <strong>Envianos el comprobante:</strong> Transferí el total de <strong>{formatPrice(finalTotal)}</strong> al CBU indicado previamente y envianos una captura del comprobante haciendo clic en el botón de WhatsApp a continuación:
                  </p>
                  <a 
                    href={`https://wa.me/5493408671408?text=Hola!%20Acabo%20de%20hacer%20un%20pedido%20con%20el%20ID%20%23${orderId.slice(0, 8).toUpperCase()}%20en%20MODO%20MATE.%20Ac%C3%A1%20est%C3%A1%20el%20comprobante%20de%20la%20transferencia.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20BA56] text-white font-bold py-2.5 px-4 rounded-none transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>
                </div>
              ) : paymentMethod === 'card' ? (
                <p className="text-brand-dark font-medium leading-relaxed">
                  💳 <strong>Pago Procesado:</strong> Tu pago con tarjeta de crédito/débito fue aprobado correctamente. En las próximas 24 horas hábiles despacharemos tu pedido a la dirección indicada. Te llegará el número de seguimiento por email.
                </p>
              ) : (
                <p className="text-brand-dark font-medium leading-relaxed">
                  ⚡ <strong>Aprobado por Mercado Pago:</strong> Tu pago fue procesado con éxito. Pronto despacharemos tu pedido y te llegará la información de rastreo.
                </p>
              )}
              
              <p className="text-brand-gray italic font-medium">Hemos enviado una copia del resumen de tu orden a tu email: <strong>{formData.email}</strong>.</p>
            </div>

            <button
              onClick={handleFinish}
              className="bg-brand-dark hover:bg-brand-green text-white font-bold py-3 px-8 rounded-none w-full transition-transform text-xs uppercase tracking-widest"
            >
              Volver a la Tienda
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
