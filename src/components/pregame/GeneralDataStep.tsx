import React from 'react';
import { UserRole } from '../../../types';
import { SportJsonItem } from './sportsData';

interface GeneralDataStepProps {
  sport: SportJsonItem;
  role: UserRole;
  isScheduleMode: boolean;
  torneo: string;
  setTorneo: (val: string) => void;
  jornada: string;
  setJornada: (val: string) => void;
  rama: string;
  setRama: (val: string) => void;
  categoria: string;
  setCategoria: (val: string) => void;
  estadio: string;
  setEstadio: (val: string) => void;
  fecha: string;
  setFecha: (val: string) => void;
  hora: string;
  setHora: (val: string) => void;
  arbitros: string;
  setArbitros: (val: string) => void;
  duracionPeriodo: number;
  setDuracionPeriodo: (val: number) => void;
  cantidadPeriodos: number;
  setCantidadPeriodos: (val: number) => void;
  maxSets: number;
  setMaxSets: (val: number) => void;
  registroMode: 'visual' | 'botones';
  setRegistroMode: (val: 'visual' | 'botones') => void;
}

export const GeneralDataStep: React.FC<GeneralDataStepProps> = ({
  sport,
  role,
  isScheduleMode,
  torneo,
  setTorneo,
  jornada,
  setJornada,
  rama,
  setRama,
  categoria,
  setCategoria,
  estadio,
  setEstadio,
  fecha,
  setFecha,
  hora,
  setHora,
  arbitros,
  setArbitros,
  duracionPeriodo,
  setDuracionPeriodo,
  cantidadPeriodos,
  setCantidadPeriodos,
  maxSets,
  setMaxSets,
  registroMode,
  setRegistroMode
}) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Tarjeta de Información del Encuentro */}
      <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm">
            <i className="fa-solid fa-circle-info"></i>
          </div>
          <h3 className="font-black text-sm text-white uppercase tracking-widest font-sans">
            Información del Encuentro
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Torneo / Competencia
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors"
              value={torneo}
              onChange={e => setTorneo(e.target.value)}
              placeholder="Ej: Metropolitano A"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Jornada / Fase
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors"
              value={jornada}
              onChange={e => setJornada(e.target.value)}
              placeholder="Ej: Fecha 4"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Rama
            </label>
            <select
              className="w-full bg-[#1c1236] border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors cursor-pointer"
              value={rama}
              onChange={e => setRama(e.target.value)}
            >
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Categoría
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="Ej: Primera División"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Estadio / Cancha
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors"
              value={estadio}
              onChange={e => setEstadio(e.target.value)}
              placeholder="Ej: Club Harrods"
            />
          </div>

          {isScheduleMode && (
            <>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                  Fecha del Partido
                </label>
                <input
                  type="date"
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner [color-scheme:dark]"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                  Hora
                </label>
                <input
                  type="time"
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner [color-scheme:dark]"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Árbitros / Jueces
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner transition-colors"
              value={arbitros}
              onChange={e => setArbitros(e.target.value)}
              placeholder="Ej: L. Gómez, M. Rodríguez"
            />
          </div>
        </div>
      </div>

      {/* Ajustes Reglamentarios Editables */}
      <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">
            <i className="fa-solid fa-sliders"></i>
          </div>
          <h3 className="font-black text-sm text-white uppercase tracking-widest font-sans">
            Ajustes Reglamentarios para {sport.nombre_visible}
          </h3>
        </div>

        {sport.reglamento.por_tiempo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                Duración del Período (Minutos)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner"
                value={duracionPeriodo}
                onChange={e => setDuracionPeriodo(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                Cantidad de Períodos
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#c6ff00] outline-none shadow-inner"
                value={cantidadPeriodos}
                onChange={e => setCantidadPeriodos(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>
        ) : sport.reglamento.modo_puntuacion === 'sets' ? (
          <div className="max-w-md">
            <p className="text-[10px] text-white/50 font-bold mb-3 uppercase">
              Formato de Sets a disputar
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMaxSets(3)}
                className={`flex-1 p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  maxSets === 3
                    ? 'bg-[#c6ff00]/20 border-[#c6ff00] text-white font-black shadow-lg shadow-[#c6ff00]/10'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xs font-black">AL MEJOR DE 3 SETS</span>
                <span className="text-[10px] opacity-60 font-medium">Gana el primero en 2 sets</span>
              </button>
              <button
                type="button"
                onClick={() => setMaxSets(5)}
                className={`flex-1 p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  maxSets === 5
                    ? 'bg-[#c6ff00]/20 border-[#c6ff00] text-white font-black shadow-lg shadow-[#c6ff00]/10'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xs font-black">AL MEJOR DE 5 SETS</span>
                <span className="text-[10px] opacity-60 font-medium">Gana el primero en 3 sets</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/50 italic">
            Este deporte utiliza el reglamento oficial estándar preconfigurado.
          </p>
        )}
      </div>

      {/* Modalidad de Registro si es Coach */}
      {role === UserRole.COACH && (
        <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm">
              <i className="fa-solid fa-gamepad"></i>
            </div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest font-sans">
              Modalidad de Registro en Vivo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setRegistroMode('visual')}
              className={`p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 cursor-pointer ${
                registroMode === 'visual'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#38bdf8]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    registroMode === 'visual' ? 'border-[#38bdf8]' : 'border-white/30'
                  }`}
                >
                  {registroMode === 'visual' && <div className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
                </div>
                <span className="font-black text-xs text-white uppercase tracking-wider">Modo Visual</span>
              </div>
              <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                Registro táctico interactivo posicionando eventos directamente en el mapa de juego.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRegistroMode('botones')}
              className={`p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 cursor-pointer ${
                registroMode === 'botones'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#38bdf8]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    registroMode === 'botones' ? 'border-[#38bdf8]' : 'border-white/30'
                  }`}
                >
                  {registroMode === 'botones' && <div className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
                </div>
                <span className="font-black text-xs text-white uppercase tracking-wider">Modo Botones</span>
              </div>
              <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                Registro ágil de alta velocidad mediante botonera segmentada por zonas.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralDataStep;
