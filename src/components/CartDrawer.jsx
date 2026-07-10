import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout
}) {
  const [zipCode, setZipCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState('branch'); // 'branch' | 'home'
  const [zipChecked, setZipChecked] = useState(false);

  if (!isOpen) return null;

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calcular costos de envío (Sucursal vs Domicilio)
  const getShippingCosts = () => {
    if (!zipCode.trim() || !zipChecked) return { home: 0, branch: 0 };

    const code = parseInt(zipCode) || 0;
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
      return { home: 9900, branch: 6900 };
    } else if (isRegional) {
      return { home: 11500, branch: 8500 };
    } else {
      return { home: 13000, branch: 9900 };
    }
  };

  const handleCalculateShipping = (e) => {
    e.preventDefault();
    if (!zipCode.trim()) return;
    setZipChecked(true);
  };

  const costs = getShippingCosts();
  const activeShippingCost = zipChecked ? (shippingMethod === 'home' ? costs.home : costs.branch) : 0;



  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Cart Container */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in">
          {/* Header */}
          <div className="px-6 py-5 bg-brand-green-dark text-white flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-gold" />
              Tu Carrito ({cartItems.length})
            </h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-brand-arena">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                <div className="w-20 h-20 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">Tu carrito está vacío</h3>
                  <p className="text-sm text-brand-gray mt-1">¿Qué tal si te preparás unos mates para empezar?</p>
                </div>
                <button
                  onClick={onClose}
                  className="bg-brand-green text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-brand-green-dark transition-colors mt-2 shadow-md"
                >
                  Ver Productos
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Product Image */}
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded-xl border border-brand-arena shrink-0 bg-brand-arena"
                  />
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-sm font-bold text-brand-dark line-clamp-1">{item.name}</h4>
                    <span className="text-[10px] text-brand-gray mt-0.5">{item.category}</span>
                    <span className="text-sm font-black text-brand-green-dark mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center border border-brand-arena rounded-lg overflow-hidden bg-brand-arena/30">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-brand-dark hover:bg-brand-arena text-xs"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-brand-dark">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-brand-dark hover:bg-brand-arena text-xs"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-brand-arena bg-brand-arena/20 p-6 space-y-4">
              
              {/* Shipping Calculator */}
              <div className="bg-white p-3 rounded-xl border border-brand-arena">
                <form onSubmit={handleCalculateShipping} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Truck className="absolute left-2.5 top-2.5 w-4 h-4 text-brand-gray" />
                    <input 
                      type="text" 
                      placeholder="Tu Código Postal (Ej: 1425)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full bg-brand-arena/35 pl-9 pr-2 py-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-green border border-transparent focus:bg-white focus:border-brand-green"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-green-dark"
                  >
                    Calcular
                  </button>
                </form>
                
                {zipChecked && (
                  <div className="mt-3 pt-2 border-t border-brand-arena/50 space-y-1.5 text-[11px] text-brand-dark">
                    <p className="font-bold text-[9px] text-brand-gray uppercase tracking-wider mb-1">
                      Envíos por Correo Argentino:
                    </p>
                    
                    {/* Opción Sucursal */}
                    <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      shippingMethod === 'branch' ? 'border-brand-dark bg-brand-arena/10 font-bold' : 'border-brand-arena/50 hover:border-brand-gray bg-white'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="radio" 
                          name="cartShippingMethod" 
                          value="branch"
                          checked={shippingMethod === 'branch'}
                          onChange={() => setShippingMethod('branch')}
                          className="text-brand-green focus:ring-0 w-3 h-3"
                        />
                        <span>A Sucursal (Más barato)</span>
                      </div>
                      <span className={costs.branch === 0 ? "text-green-600 font-extrabold" : ""}>
                        {costs.branch === 0 ? "¡Gratis!" : formatPrice(costs.branch)}
                      </span>
                    </label>

                    {/* Opción Domicilio */}
                    <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      shippingMethod === 'home' ? 'border-brand-dark bg-brand-arena/10 font-bold' : 'border-brand-arena/50 hover:border-brand-gray bg-white'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="radio" 
                          name="cartShippingMethod" 
                          value="home"
                          checked={shippingMethod === 'home'}
                          onChange={() => setShippingMethod('home')}
                          className="text-brand-green focus:ring-0 w-3 h-3"
                        />
                        <span>A Domicilio</span>
                      </div>
                      <span className={costs.home === 0 ? "text-green-600 font-extrabold" : ""}>
                        {costs.home === 0 ? "¡Gratis!" : formatPrice(costs.home)}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Order breakdown */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-brand-gray">
                  <span>Subtotal:</span>
                  <span className="font-bold text-brand-dark">{formatPrice(subtotal)}</span>
                </div>
                


                {zipChecked && activeShippingCost > 0 && (
                  <div className="flex justify-between text-brand-gray text-xs">
                    <span>Envío ({shippingMethod === 'home' ? 'Domicilio' : 'Sucursal'} Correo Argentino):</span>
                    <span>{formatPrice(activeShippingCost)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-base font-black text-brand-dark border-t border-brand-arena pt-2">
                  <span>Total estimado:</span>
                  <span className="text-lg text-brand-green-dark">
                    {formatPrice(subtotal + activeShippingCost)}
                  </span>
                </div>
              </div>

              {/* Call to action */}
              <button
                onClick={onCheckout}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
              >
                <span>Iniciar Compra</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
