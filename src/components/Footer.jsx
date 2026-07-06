import React from 'react';
import Logo from './Logo';
import { Phone, MapPin, Clock, Send } from 'lucide-react';

export default function Footer({ setCurrentTab, setCurrentPage }) {
  return (
    <footer className="bg-brand-dark text-white border-t border-white/10 mt-auto">
      {/* Upper Footer section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand/About */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white text-brand-dark p-0.5">
              <Logo className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wider text-white">MODO MATE</h3>
              <span className="text-[9px] text-brand-gold font-bold uppercase tracking-widest leading-none block">y otras yerbas</span>
            </div>
          </div>
          <p className="text-sm text-brand-gray leading-relaxed">
            Tu tienda especializada en mates imperiales, termos, yerbas orgánicas y blends de hierbas premium. Llevamos el ritual matero a otro nivel.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-2">
            <a 
              href="https://www.instagram.com/modo__mate/" 
              target="_blank" 
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-gold hover:text-brand-dark transition-colors"
              title="Instagram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a 
              href="https://wa.me" 
              target="_blank" 
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-gold hover:text-brand-dark transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">Categorías</h3>
          <ul className="space-y-2.5 text-sm text-brand-gray">
            {['Mates', 'Termos', 'Yerbas', 'Hierbas', 'Accesorios'].map((cat) => (
              <li key={cat}>
                <button 
                  onClick={() => { if (setCurrentPage) setCurrentPage('productos'); setCurrentTab('shop'); }} 
                  className="hover:text-brand-gold transition-colors text-left"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact/Info */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">Nuestro Local</h3>
          <ul className="space-y-3 text-sm text-brand-gray">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>J.M. Bullo 1275<br />San Cristóbal, Santa Fe</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-gold shrink-0" />
              <span>WhatsApp disponible</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>Lunes a Viernes: 9:00 - 13:00 / 17:00 - 21:00<br />Sábados: 9:00 - 13:00</span>
            </li>
          </ul>
        </div>

        {/* Newsletter / Mock Sign-up */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-gold mb-4">Novedades</h3>
          <p className="text-sm text-brand-gray mb-3.5 leading-relaxed">
            Dejanos tu email para enterarte de nuevos ingresos de mates imperiales y combos exclusivos.
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); alert('¡Gracias por suscribirte a MODO MATE!'); }}
            className="flex w-full"
          >
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              required
              className="bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-sm text-white placeholder-brand-gray focus:outline-none focus:border-brand-gold flex-1"
            />
            <button 
              type="submit" 
              className="bg-brand-gold text-brand-dark rounded-r-lg px-3 py-2 hover:bg-brand-gold-dark transition-colors flex items-center justify-center"
              aria-label="Suscribirse"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Payment methods and copyright */}
      <div className="bg-black/20 border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-gray text-center sm:text-left">
            &copy; {new Date().getFullYear()} MODO MATE. Todos los derechos reservados. Maqueta de demostración.
          </p>
          {/* Payment Badges list */}
          <div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold text-brand-gray uppercase tracking-widest">
            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">Mercado Pago</span>
            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">Efectivo 10% OFF</span>
            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">Tarjetas Crédito/Débito</span>
            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">Transferencia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
