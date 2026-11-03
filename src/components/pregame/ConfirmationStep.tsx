import React from 'react';
import { UserRole } from '../../../types';
import { SportJsonItem, SPORT_IMAGES } from './sportsData';

interface ConfirmationStepProps {
  sport: SportJsonItem;
  role: UserRole;
  isScheduleMode: boolean;
  torneo: string;
  jornada: string;
  rama: string;
  categoria: string;
  estadio: string;
  fecha: string;
  hora: string;
  arbitros: string;
  teamHome: string;
  teamHomePrimary: string;
  teamHomeSecondary: string;
  teamAway: string;
  teamAwayPrimary: string;
  teamAwaySecondary: string;
  duracionPeriodo: number;
  cantidadPeriodos: number;
  maxSets: number;
  registroMode: 'visual' | 'botones';
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  sport,
  role,
  isScheduleMode,
  torneo,
  jornada,
  rama,
  categoria,
  estadio,
  fecha,
  hora,
  arbitros,
  teamHome,
  teamHomePrimary,
  teamHomeSecondary,
  teamAway,
  teamAwayPrimary,
  teamAwaySecondary,
  duracionPeriodo,
  cantidadPeriodos,
  maxSets,
  registroMode
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Banner de Deporte Seleccionado */}
      <div className="relative rounded-3xl overflow-hidden h-40 md:h-48 border border-white/10 shadow-2xl">
        <img
          src={SPORT_IMAGES[sport.id] || ''}
          alt={sport.nombre_visible}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="bg-[#c6ff00]/20 text-[#c6ff00] border border-[#c6ff00]/40 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-inner">
              Paso 5 de 5 • Listo para comenzar
            </span>
            <span className="text-xs font-mono text-white/60">
              {isScheduleMode ? 'Partido Programado' : 'Partido en Vivo'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Deporte Confirmado
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight font-sans">
              {sport.nombre_visible}
            </h2>
          </div>
        </div>
      </div>

      {/* Enfrentamiento Head to Head */}
      <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <h3 className="font-black text-xs text-white/50 uppercase tracking-widest mb-6 text-center">
          Duelo Confirmado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Equipo Local */}
          <div className="md:col-span-2 flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest mb-2">
              EQUIPO LOCAL
            </span>
            <div
              style={{ backgroundColor: teamHomePrimary, color: teamHomeSecondary }}
              className="w-full h-14 rounded-2xl flex items-center justify-center font-black uppercase text-base tracking-wider px-4 shadow-lg border border-white/10 font-sans"
            >
              {teamHome || 'LOCAL'}
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex flex-col items-center justify-center my-2 md:my-0">
            <div className="w-12 h-12 rounded-full bg-[#1c1236] border-2 border-[#c6ff00] shadow-[0_0_15px_rgba(198,255,0,0.3)] flex items-center justify-center font-black text-white text-xs tracking-wider">
              VS
            </div>
          </div>

          {/* Equipo Visitante */}
          <div className="md:col-span-2 flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mb-2">
              EQUIPO VISITANTE
            </span>
            <div
              style={{ backgroundColor: teamAwayPrimary, color: teamAwaySecondary }}
              className="w-full h-14 rounded-2xl flex items-center justify-center font-black uppercase text-base tracking-wider px-4 shadow-lg border border-white/10 font-sans"
            >
              {teamAway || 'VISITANTE'}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Metadatos y Reglamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metadatos */}
        <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-trophy text-[#c6ff00] text-sm"></i>
            <h4 className="font-black text-xs text-white uppercase tracking-wider font-sans">
              Datos del Fixture
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/40 font-mono">Torneo:</span>
              <span className="text-white font-bold">{torneo || 'Partido Único'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/40 font-mono">Jornada:</span>
              <span className="text-white font-bold">{jornada || 'Fecha 1'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/40 font-mono">Rama / Cat:</span>
              <span className="text-white font-bold">{rama} • {categoria || 'General'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/40 font-mono">Estadio:</span>
              <span className="text-white font-bold">{estadio || 'Estadio Principal'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-white/40 font-mono">Árbitros:</span>
              <span className="text-white font-bold">{arbitros || 'Juez Oficial'}</span>
            </div>
          </div>
        </div>

        {/* Configuración de Juego */}
        <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-clock text-[#c6ff00] text-sm"></i>
            <h4 className="font-black text-xs text-white uppercase tracking-wider font-sans">
              Parámetros de Partido
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {sport.reglamento.por_tiempo && (
              <>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40 font-mono">Períodos:</span>
                  <span className="text-white font-bold">{cantidadPeriodos} tiempos</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40 font-mono">Duración c/u:</span>
                  <span className="text-white font-bold">{duracionPeriodo} minutos</span>
                </div>
              </>
            )}
            {sport.reglamento.modo_puntuacion === 'sets' && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40 font-mono">Formato de Sets:</span>
                <span className="text-white font-bold">Al mejor de {maxSets} sets</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/40 font-mono">Titulares:</span>
              <span className="text-white font-bold">{sport.reglamento.jugadores_titulares} jugadores en cancha</span>
            </div>
            {role === UserRole.COACH && (
              <div className="flex justify-between py-1">
                <span className="text-white/40 font-mono">Modo de Registro:</span>
                <span className="text-[#38bdf8] font-bold uppercase">
                  {registroMode === 'visual' ? 'Interactivo Visual' : 'Botonera Clásica'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
