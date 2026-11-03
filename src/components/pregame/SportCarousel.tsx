import React from 'react';
import { SPORTS_CATALOG, SPORT_IMAGES, SportJsonItem } from './sportsData';

interface SportCarouselProps {
  selectedSportId: string;
  onSelectSport: (sportId: string) => void;
  sports?: SportJsonItem[];
}

export const SportCarousel: React.FC<SportCarouselProps> = ({
  selectedSportId,
  onSelectSport,
  sports = SPORTS_CATALOG
}) => {
  const currentIndex = sports.findIndex(s => s.id === selectedSportId) !== -1
    ? sports.findIndex(s => s.id === selectedSportId)
    : 0;

  const prevIndex = (currentIndex - 1 + sports.length) % sports.length;
  const nextIndex = (currentIndex + 1) % sports.length;

  const currentSport = sports[currentIndex];
  const prevSport = sports[prevIndex];
  const nextSport = sports[nextIndex];

  const handlePrev = () => {
    onSelectSport(prevSport.id);
  };

  const handleNext = () => {
    onSelectSport(nextSport.id);
  };

  return (
    <div className="relative w-full flex items-center justify-center gap-2 sm:gap-4 my-2 select-none">
      {/* Botón Circular Izquierdo */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Deporte anterior"
        className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg shrink-0 active:scale-90 z-20"
      >
        <i className="fa-solid fa-chevron-left text-sm"></i>
      </button>

      {/* Deporte Lateral Izquierdo (Adyacente - Preview con escala y opacidad reducida) */}
      <button
        type="button"
        onClick={handlePrev}
        className="hidden sm:block shrink-0 w-44 md:w-56 lg:w-64 h-36 md:h-44 lg:h-48 rounded-3xl relative overflow-hidden transition-all duration-300 scale-90 opacity-40 blur-[0.5px] hover:opacity-60 cursor-pointer border border-white/10 shadow-md text-left"
      >
        <img
          src={SPORT_IMAGES[prevSport.id] || ''}
          alt={prevSport.nombre_visible}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <span className="absolute bottom-4 left-4 font-black text-lg md:text-xl text-white uppercase tracking-wider drop-shadow-md font-sans">
          {prevSport.nombre_visible}
        </span>
      </button>

      {/* Deporte Central (Seleccionado - Con foco, marco verde lima y escala protagonista) */}
      <div
        id={`selected-sport-${currentSport.id}`}
        className="relative shrink-0 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-52 sm:h-60 md:h-64 rounded-3xl overflow-hidden border-2 border-[#c6ff00] shadow-[0_0_30px_rgba(198,255,0,0.2)] transition-all duration-300 z-10"
      >
        <img
          src={SPORT_IMAGES[currentSport.id] || ''}
          alt={currentSport.nombre_visible}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {/* Gradiente oscuro inferior para garantizar máximo contraste y legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Nombre del deporte en tipografía deportiva pesada */}
        <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight drop-shadow-lg font-sans">
            {currentSport.nombre_visible}
          </h2>
        </div>
      </div>

      {/* Deporte Lateral Derecho (Adyacente - Preview con escala y opacidad reducida) */}
      <button
        type="button"
        onClick={handleNext}
        className="hidden sm:block shrink-0 w-44 md:w-56 lg:w-64 h-36 md:h-44 lg:h-48 rounded-3xl relative overflow-hidden transition-all duration-300 scale-90 opacity-40 blur-[0.5px] hover:opacity-60 cursor-pointer border border-white/10 shadow-md text-left"
      >
        <img
          src={SPORT_IMAGES[nextSport.id] || ''}
          alt={nextSport.nombre_visible}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <span className="absolute bottom-4 left-4 font-black text-lg md:text-xl text-white uppercase tracking-wider drop-shadow-md font-sans">
          {nextSport.nombre_visible}
        </span>
      </button>

      {/* Botón Circular Derecho */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Siguiente deporte"
        className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg shrink-0 active:scale-90 z-20"
      >
        <i className="fa-solid fa-chevron-right text-sm"></i>
      </button>
    </div>
  );
};

export default SportCarousel;
