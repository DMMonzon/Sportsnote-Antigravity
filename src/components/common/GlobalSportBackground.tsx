import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SPORT_BACKGROUNDS, SportBackground } from '../../constants/backgrounds';

// Mantiene en memoria el fondo seleccionado durante la sesión para evitar saltos en la navegación
let cachedBackground: SportBackground | null = null;

const getRandomBackground = (): SportBackground | null => {
  if (SPORT_BACKGROUNDS.length === 0) return null;
  if (!cachedBackground) {
    const randomIndex = Math.floor(Math.random() * SPORT_BACKGROUNDS.length);
    cachedBackground = SPORT_BACKGROUNDS[randomIndex];
  }
  return cachedBackground;
};

export const GlobalSportBackground: React.FC = () => {
  const location = useLocation();
  const [bg] = useState<SportBackground | null>(getRandomBackground);

  // 3. Regla de Exclusión:
  // Si la ruta actual es la vista en vivo de partido (LiveGameView), 
  // este componente no debe renderizarse en el DOM
  const isLiveGame = location.pathname.startsWith('/live');

  if (isLiveGame || !bg) {
    return null;
  }

  return (
    <>
      {/* Imagen de fondo */}
      <img
        src={bg.url}
        alt={`Fondo deportivo ${bg.sport}`}
        className="fixed inset-0 w-full h-full object-cover -z-20 pointer-events-none filter grayscale brightness-50 contrast-125"
      />

      {/* Overlay mate */}
      <div
        className="fixed inset-0 bg-[#0c0f17]/75 backdrop-blur-[2px] -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Atribución legal exigida en el pie derecho */}
      <div className="fixed bottom-2 right-3 z-50 text-[10px] text-white/50 tracking-wider pointer-events-auto select-none bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
        <span>
          Foto por{' '}
          <a
            href={bg.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#c6ff00] transition-colors"
          >
            {bg.authorName}
          </a>{' '}
          en{' '}
          <a
            href="https://unsplash.com/?utm_source=sportsnote&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#c6ff00] transition-colors"
          >
            Unsplash
          </a>
        </span>
      </div>
    </>
  );
};

export default GlobalSportBackground;
