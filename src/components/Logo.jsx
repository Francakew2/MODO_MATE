import React from 'react';

export default function Logo({ className = "w-16 h-16" }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo y borde circular exterior */}
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="6" fill="#FDFDFB" />
      
      {/* Círculo delgado interior */}
      <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="2" />
      
      {/* Rutas ocultas para las curvas de texto */}
      <path id="curveTop" d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="none" />
      {/* Nota: la curva inferior ahora va de izquierda a derecha (sweep-flag 0) para que las letras queden al derecho y se lean de izquierda a derecha */}
      <path id="curveBottom" d="M 30 105 A 70 70 0 0 0 170 105" fill="none" stroke="none" />
      
      {/* Texto MODO (Arriba) */}
      <text className="font-sans font-black fill-black text-[22px] tracking-[0.25em]">
        <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
          MODO
        </textPath>
      </text>

      {/* Texto MATE (Abajo) */}
      <text className="font-sans font-black fill-black text-[22px] tracking-[0.25em]">
        <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
          MATE
        </textPath>
      </text>
      
      {/* Dibujo del mate en el centro */}
      {/* Cuerpo del mate (Calabaza) */}
      <path d="M 72 103 C 70 135, 130 135, 128 103 C 128 92, 72 92, 72 103 Z" fill="#FDFDFB" stroke="black" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Boca/Borde del mate */}
      <ellipse cx="100" cy="95" rx="23" ry="6" fill="#FDFDFB" stroke="black" strokeWidth="5" />
      
      {/* Bombilla */}
      {/* Caño */}
      <path d="M 105 91 L 126 64" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" />
      {/* Pico de la bombilla */}
      <path d="M 126 64 C 126 64, 132 60, 137 60" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" />
      {/* Anillo del pico */}
      <path d="M 122 69 L 127 65" fill="none" stroke="black" strokeWidth="4" />
    </svg>
  );
}
