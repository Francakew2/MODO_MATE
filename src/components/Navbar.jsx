import React from 'react';
import Logo from './Logo';
import { ShoppingCart, Search, UserCheck, ShieldAlert, Store, Home } from 'lucide-react';

export default function Navbar({
  currentPage,
  setCurrentPage,
  currentTab,
  setCurrentTab,
  cartCount,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  userRole,
  toggleRole
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-brand-green-dark text-white shadow-md">
      {/* Top Banner (Info/Promociones) */}
      <div className="bg-brand-gold text-brand-dark text-xs font-bold text-center py-1.5 px-4 tracking-wider uppercase">
        🌿 ¡10% de descuento abonando por transferencia o efectivo! • Envío gratis superando los $75.000
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => { setCurrentPage('home'); setCurrentTab('shop'); }} 
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="text-brand-dark w-12 h-12 rounded-full overflow-hidden border border-white/20 transition-transform group-hover:scale-105">
            <Logo className="w-full h-full" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-widest text-white m-0 leading-none">MODO MATE</h1>
            <span className="text-[10px] text-brand-gold font-semibold tracking-widest uppercase">y otras yerbas</span>
          </div>
        </div>

        {/* Search Bar (Solo visible en la página de Productos, tab shop) */}
        {currentPage === 'productos' && currentTab === 'shop' && (
          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              placeholder="Buscar termos, mates, yerbas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/60 pl-10 pr-4 py-2 rounded-full border border-white/20 focus:outline-none focus:bg-white focus:text-brand-dark focus:placeholder-brand-gray transition-all text-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/60 pointer-events-none focus-within:text-brand-gray" />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Navegación Principal: Inicio */}
          <button
            onClick={() => { setCurrentPage('home'); setCurrentTab('shop'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'home' 
                ? 'bg-white/15 text-white' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden xs:inline">Inicio</span>
          </button>

          {/* Navegación Principal: Productos */}
          <button
            onClick={() => { setCurrentPage('productos'); setCurrentTab('shop'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 'productos' 
                ? 'bg-white/15 text-white' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="hidden xs:inline">Productos</span>
          </button>

          {/* Role Switcher Demo Control */}
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              userRole === 'admin' 
                ? 'bg-amber-500 text-brand-dark hover:bg-amber-400' 
                : 'bg-white/10 text-brand-gold hover:bg-white/20'
            }`}
            title="Cambiar rol para demostración de la maqueta"
          >
            {userRole === 'admin' ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Cliente</span>
                <span className="sm:hidden">Cli</span>
              </>
            )}
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Abrir carrito de compras"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-gold text-brand-dark text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-green-dark animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (Only shown on productos page, shop tab, and small screens) */}
      {currentPage === 'productos' && currentTab === 'shop' && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar termos, mates, yerbas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/60 pl-10 pr-4 py-2.5 rounded-full border border-white/20 focus:outline-none focus:bg-white focus:text-brand-dark focus:placeholder-brand-gray text-sm"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-white/60 pointer-events-none" />
          </div>
        </div>
      )}
    </header>
  );
}
