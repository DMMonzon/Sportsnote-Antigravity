import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SportJsonItem } from './sportsData';

interface SportParametersPanelProps {
  sport: SportJsonItem;
  onEditRules?: () => void;
}

export const SportParametersPanel: React.FC<SportParametersPanelProps> = ({ sport, onEditRules }) => {
  const navigate = useNavigate();
  const { reglamento } = sport;

  // 1. Tiempo de Juego
  const periodoLabel = reglamento.cantidad_periodos === 2 ? 'tiempos' : 'cuartos';
  const tiempoDeJuego = reglamento.por_tiempo
    ? `${reglamento.cantidad_periodos} ${periodoLabel} de ${reglamento.duracion_periodo_minutos} min`
    : `Sin tiempo fijo (A sets de ${reglamento.puntos_para_ganar_set || 25} pts)`;

  // 2. Titulares en Cancha
  const titularesEnCancha = `${reglamento.jugadores_titulares} jugadores titulares`;

  // 3. Cambios Reglamentarios
  const maxCambios = reglamento.widgets_header?.max_cambios ?? 99;
  const cambiosReglamentarios = `Máx. ${maxCambios} cambios`;

  // 4. Desempate / Empate
  const desempateEmpate = reglamento.permite_empate
    ? 'Permite empate en fase regular'
    : 'Sin empate (Requiere definición)';

  const handleEditRules = () => {
    if (onEditRules) {
      onEditRules();
      return;
    }
    navigate('/dashboard?section=ajustes&sub=reglamentos', { state: { section: 'ajustes', subSection: 'reglamentos' } });
  };

  return (
    <div className="w-full bg-[#0d121f]/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-xl mt-4 select-none animate-in fade-in duration-300">
      {/* Título de bloque con punto verde neón y botón de editar reglas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c6ff00] shadow-[0_0_10px_#c6ff00] shrink-0 animate-pulse" />
          <h3 className="font-black text-sm md:text-base text-white uppercase tracking-wider font-sans">
            PARÁMETROS REGLAMENTARIOS — {sport.nombre_visible}
          </h3>
        </div>

        {/* Botón interactivo: Editar reglas */}
        <button
          type="button"
          onClick={handleEditRules}
          className="text-xs font-mono text-white/40 hover:text-[#c6ff00] tracking-wider sm:text-right flex items-center gap-1.5 cursor-pointer transition-all duration-200 group w-fit"
          title="Ir a Ajustes / Gestionar reglamentos"
        >
          <i className="fa-solid fa-sliders text-[11px] text-[#c6ff00]/70 group-hover:text-[#c6ff00] group-hover:rotate-45 transition-all duration-300"></i>
          <span className="underline decoration-white/20 group-hover:decoration-[#c6ff00] underline-offset-4">editar reglas</span>
        </button>
      </div>

      {/* Grid de 4 micro-cards con los valores reales del reglamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tiempo de Juego */}
        <div className="bg-[#121824]/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors shadow-inner">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-regular fa-clock text-[#c6ff00] text-xs"></i>
              <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                TIEMPO DE JUEGO
              </span>
            </div>
            <p className="text-xs md:text-sm font-bold text-white leading-snug">
              {tiempoDeJuego}
            </p>
          </div>
          <span className="text-[10px] text-white/40 mt-2 block font-medium">
            {reglamento.por_tiempo ? 'Cronómetro reglamentario activo' : 'Puntuación por sets oficiales'}
          </span>
        </div>

        {/* Card 2: Titulares en Cancha */}
        <div className="bg-[#121824]/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors shadow-inner">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-users text-[#c6ff00] text-xs"></i>
              <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                TITULARES EN CANCHA
              </span>
            </div>
            <p className="text-xs md:text-sm font-bold text-white leading-snug">
              {titularesEnCancha}
            </p>
          </div>
          <span className="text-[10px] text-white/40 mt-2 block font-medium">
            Por equipo en campo de juego
          </span>
        </div>

        {/* Card 3: Cambios Reglamentarios */}
        <div className="bg-[#121824]/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors shadow-inner">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-repeat text-[#c6ff00] text-xs"></i>
              <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                CAMBIOS REGLAMENTARIOS
              </span>
            </div>
            <p className="text-xs md:text-sm font-bold text-white leading-snug">
              {cambiosReglamentarios}
            </p>
          </div>
          <span className="text-[10px] text-white/40 mt-2 block font-medium">
            {maxCambios >= 90 ? 'Sustituciones rotativas ilimitadas' : 'Ventanas y cambios permitidos'}
          </span>
        </div>

        {/* Card 4: Desempate / Empate */}
        <div className="bg-[#121824]/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors shadow-inner">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-scale-balanced text-[#c6ff00] text-xs"></i>
              <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                DESEMPATE / EMPATE
              </span>
            </div>
            <p className="text-xs md:text-sm font-bold text-white leading-snug">
              {desempateEmpate}
            </p>
          </div>
          <span className="text-[10px] text-white/40 mt-2 block font-medium">
            {reglamento.permite_empate ? 'Fase regular con puntos compartidos' : 'Definición obligatoria'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SportParametersPanel;
