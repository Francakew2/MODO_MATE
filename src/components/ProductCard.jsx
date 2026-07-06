import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const isOutOfStock = product.stock === 0;

  // Formatear precio en pesos argentinos
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-brand-arena shadow-sm hover-lift-glow flex flex-col h-full relative">
      {/* Product Image and badges */}
      <div className="relative aspect-square overflow-hidden bg-brand-arena cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-brand-green-dark/95 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
          {product.category}
        </span>

        {/* Out of Stock overlay & badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-black uppercase px-4 py-2 rounded-full tracking-widest shadow-md">
              Sin Stock
            </span>
          </div>
        ) : (
          /* Hover Action Overlay */
          <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
              className="bg-white text-brand-dark p-3 rounded-full shadow-lg hover:bg-brand-gold hover:text-brand-dark transition-all duration-300 hover:scale-110"
              title="Ver detalles"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 
          onClick={() => onViewDetails(product)}
          className="text-base font-bold text-brand-dark hover:text-brand-green cursor-pointer line-clamp-1 mb-1 transition-colors"
        >
          {product.name}
        </h3>
        
        {/* Description preview */}
        <p className="text-xs text-brand-gray line-clamp-2 mb-4 leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Footer info (Price & Buy Button) */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-brand-arena mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-lg font-black text-brand-green-dark">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">
              {formatPrice(product.price * 0.9)} en efectivo
            </span>
          </div>

          {/* Add to Cart button */}
          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-brand-arena text-brand-gray/50 cursor-not-allowed'
                : 'bg-brand-green text-white hover:bg-brand-green-dark hover:scale-105 active:scale-95 shadow-md shadow-brand-green/10'
            }`}
            title={isOutOfStock ? "Producto sin stock" : "Agregar al carrito"}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
