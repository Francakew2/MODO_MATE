import React from 'react';
import Logo from './Logo';
import { ShoppingCart, Search, UserCheck, ShieldAlert, Store, Home, User } from 'lucide-react';

export default function Navbar({
  currentPage,
  setCurrentPage,
  currentTab,
  setCurrentTab,
  cartCount,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  user,
  userRole,
  onLogin,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-brand-green-dark text-white shadow-md">
      {/* Top Banner (Info/Promociones) */}
      <div className="bg-brand-gold text-brand-dark text-xs font-bold text-center py-1.5 px-4 tracking-wider uppercase">
        🌿 ¡10% de descuento abonando por transferencia! • Envío gratis superando los $95.000
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-200 ${
              currentPage === 'home' 
                ? 'bg-white/20 text-brand-gold shadow-sm' 
                : 'text-white/90 hover:text-brand-gold hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="inline">Inicio</span>
          </button>

          {/* Navegación Principal: Productos */}
          <button
            onClick={() => { setCurrentPage('productos'); setCurrentTab('shop'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-200 ${
              currentPage === 'productos' && currentTab !== 'admin'
                ? 'bg-white/20 text-brand-gold shadow-sm' 
                : 'text-white/90 hover:text-brand-gold hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span className="inline">Productos</span>
          </button>

          {/* Navegación Principal: Contacto */}
          <button
            onClick={() => { setCurrentPage('contacto'); setCurrentTab('shop'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-200 ${
              currentPage === 'contacto' 
                ? 'bg-white/20 text-brand-gold shadow-sm' 
                : 'text-white/90 hover:text-brand-gold hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="inline">Contacto</span>
          </button>

          {/* Autenticación Real de Supabase */}
          {!user ? (
            <button
              onClick={onLogin}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              title="Iniciar sesión con Google"
            >
              <span>Ingresar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Si es Admin, mostrar el botón de acceso al panel */}
              {userRole === 'admin' && (
                <button
                  onClick={() => { setCurrentPage('productos'); setCurrentTab('admin'); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-amber-500 text-brand-dark'
                      : 'bg-white/10 text-brand-gold hover:bg-white/20'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Panel Admin</span>
                </button>
              )}

              {/* Botón de Logout o Avatar */}
              <div className="flex items-center gap-2 group relative cursor-pointer py-2">
                <img
                  src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                  alt={user.user_metadata?.full_name || 'Usuario'}
                  className="w-8 h-8 rounded-full border border-white/40 object-cover"
                />
                
                {/* Menú flotante al pasar el mouse (hover) */}
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white text-brand-dark rounded-xl shadow-lg border border-brand-arena py-2 w-48 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-brand-arena">
                    <p className="text-xs font-bold truncate">{user.user_metadata?.full_name || 'Cliente MODO MATE'}</p>
                    <p className="text-[10px] text-brand-gray truncate">{user.email}</p>
                  </div>
                  {userRole !== 'admin' && (
                    <button
                      onClick={() => { setCurrentPage('productos'); setCurrentTab('my-orders'); }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-brand-arena/30 transition-colors"
                    >
                      Mis Pedidos 📦
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}

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
