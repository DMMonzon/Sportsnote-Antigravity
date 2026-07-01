
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};
import { UserRole, Game, GameEvent, Possession, TacticalScheme } from '../types';

import { PersistenceManager } from '../services/PersistenceManager';
import { aiService } from '../services/aiService';
import { StorageService } from '../services/StorageService';
import { PitchMap } from '../components/PitchMap';
import { db, auth, doc, setDoc, getDoc, collection, getDocs, query, where, serverTimestamp } from '../services/firebase';
const NSeparator = () => (
  <div className="hidden md:flex w-8 h-8 md:w-10 md:h-10 items-center justify-center shrink-0">
    <img
      src="./assets/logo-sportsnote-v2.png"
      alt="SportNotes Logo"
      className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
    />
  </div>
);

const TacticIcon = ({ active, animated = false }: { active: boolean, animated?: boolean }) => (
  <div className="relative flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-all ${active ? 'text-primary scale-110' : 'text-white/40'}`}>
      <path d="M4 4L8 8M8 4L4 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 16L20 20M20 16L16 20" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 19C6 19 7 13 15 13" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 10L16 13L13 16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="6" cy="19" r="2" fill="white" stroke="#94a3b8" strokeWidth="2" />
    </svg>
    {animated && (
      <span className="absolute -bottom-1 left-1.2 w-4 h-1 bg-[#00fe00] rounded-full blur-[2px] animate-pulse shadow-[0_0_8px_#00fe00]"></span>
    )}
  </div>
);



type ActionFilter = 'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO';
type PeriodFilter = 'ALL' | 1 | 2 | 3 | 4;

const EntryAnalysisCard: React.FC<{
  title: string;
  homeTotal: number;
  awayTotal: number;
  icon?: string;
  children: React.ReactNode;
}> = ({ title, homeTotal, awayTotal, icon, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-white p-5 rounded-[28px] border-[1px] border-white shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <h4 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white">{homeTotal}/{awayTotal}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-6 h-6 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <span className="text-[10px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="flex-1 flex flex-col gap-6 py-2 animate-in slide-in-from-top duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

const StatDetailCard = ({ title, data, colorClass, showDetails = true, compact = false, icon }: { title: any, data: any, colorClass: string, showDetails?: boolean, compact?: boolean, icon?: string | React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const colorMap: { [key: string]: { text: string, bg: string, border: string, accent: string } } = {
    'text-orange-600': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-500' },
    'text-emerald-600': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-500' },
    'text-red-600': { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-500' },
    'text-slate-700': { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-500' },
  };
  const style = colorMap[colorClass] || colorMap['text-slate-700'];
  const highlightBg = style.bg.replace('50', '100');

  const halfValues = [data.own, data.rival].filter(v => v > 0);
  const maxHalfVal = halfValues.length > 0 ? Math.max(...halfValues) : -1;
  const isMaxHalf = (val: number) => val > 0 && val === maxHalfVal;

  const laneValues = [data.left, data.center, data.right].filter(v => v > 0);
  const maxLaneVal = laneValues.length > 0 ? Math.max(...laneValues) : -1;
  const isMaxLane = (val: number) => val > 0 && val === maxLaneVal;

  return (
    <div className={`border-white ${compact ? 'p-3 rounded-2xl' : 'p-5 rounded-[28px]'} border-[1px] border-white shadow-sm flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className={`flex justify-between items-center ${showDetails && isExpanded ? 'border-b border-white/10 pb-2' : ''}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <div className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">{title}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-white`}>{data.total}</span>
          {showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-6 h-6 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <span className="text-[10px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
            </button>
          )}
        </div>
      </div>

      {showDetails && isExpanded && (
        <div className="animate-in slide-in-from-top duration-300 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.own) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10/40 border-white/10/30'}`}>
              <span className={`${isMaxHalf(data.own) ? style.accent : 'text-blue-500'} text-[10px]`}>↓</span>
              <div className="flex flex-col">
                <span className={`font-lato text-[15px] font-bold uppercase ${isMaxHalf(data.own) ? style.text : 'text-white opacity-60'} leading-none`}>En Campo Propio</span>
                <span className="text-[18px] font-black leading-none text-white">{data.own}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.rival) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10/40 border-white/10/30'}`}>
              <span className={`${isMaxHalf(data.rival) ? style.accent : 'text-orange-500'} text-[10px]`}>↑</span>
              <div className="flex flex-col">
                <span className={`font-lato text-[15px] font-bold uppercase ${isMaxHalf(data.rival) ? style.text : 'text-white opacity-60'} leading-none`}>En Campo Rival</span>
                <span className="text-[18px] font-black leading-none text-white">{data.rival}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.left) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10/40 border-white/10/30'}`}>
              <span className={`font-lato text-[15px] font-black uppercase mb-0.5 ${isMaxLane(data.left) ? style.text : 'text-white opacity-60'}`}>Izquierda</span>
              <span className="text-[16px] font-black text-white">{data.left}</span>
            </div>
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.center) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10/40 border-white/10/30'}`}>
              <span className={`font-lato text-[15px] font-black uppercase mb-0.5 ${isMaxLane(data.center) ? style.text : 'text-white opacity-60'}`}>Centro</span>
              <span className="text-[16px] font-black text-white">{data.center}</span>
            </div>
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.right) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10/40 border-white/10/30'}`}>
              <span className={`font-lato text-[15px] font-black uppercase mb-0.5 ${isMaxLane(data.right) ? style.text : 'text-white opacity-60'}`}>Derecha</span>
              <span className="text-[16px] font-black text-white">{data.right}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatComparisonCard = ({ title, icon, homeData, awayData, allEvents, homeColor, awayColor }: { title: string, icon: any, homeData: any, awayData: any, allEvents: GameEvent[], homeColor: string, awayColor: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getOutcomes = (events: GameEvent[]) => {
    const outcomes = { gol: 0, atajado: 0, desviado: 0, perdida: 0 };
    events.forEach(ev => {
      const idx = allEvents.findIndex(e => e.id === ev.id);
      if (idx !== -1 && idx < allEvents.length - 1) {
        const next = allEvents[idx + 1];
        const nextType = next.type.toUpperCase();
        if (nextType.includes('GOL')) outcomes.gol++;
        else if (nextType.includes('ATAJADO')) outcomes.atajado++;
        else if (nextType.includes('DESVIADO')) outcomes.desviado++;
        else if (nextType.includes('PÉRDIDA') || nextType.includes('FALTA COMETIDA')) outcomes.perdida++;
      }
    });
    return outcomes;
  };

  const homeOutcomes = getOutcomes(homeData.events);
  const awayOutcomes = getOutcomes(awayData.events);

  return (
    <div className="border-white p-5 rounded-[28px] border-[1px] border-white shadow-sm flex flex-col gap-4">
      <div className={`flex justify-between items-center ${isExpanded ? 'border-b border-white/10 pb-3' : ''}`}>
        <div className="flex items-center gap-2">
          {typeof icon === 'string' ? <span className="text-xs">{icon}</span> : icon}
          <h4 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white">{homeData.total}/{awayData.total}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-6 h-6 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <span className="text-[10px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 py-1 border-b border-white/10/30">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: homeColor }}></div>
            <div className="grid grid-cols-4 flex-1 gap-1">
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Gol:</span>
                <span className="text-[16px] font-black text-white leading-none">{homeOutcomes.gol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Ata:</span>
                <span className="text-[16px] font-black text-white leading-none">{homeOutcomes.atajado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Des:</span>
                <span className="text-[16px] font-black text-white leading-none">{homeOutcomes.desviado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Pér:</span>
                <span className="text-[16px] font-black text-white leading-none">{homeOutcomes.perdida}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: awayColor }}></div>
            <div className="grid grid-cols-4 flex-1 gap-1">
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Gol:</span>
                <span className="text-[16px] font-black text-white leading-none">{awayOutcomes.gol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Ata:</span>
                <span className="text-[16px] font-black text-white leading-none">{awayOutcomes.atajado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Des:</span>
                <span className="text-[16px] font-black text-white leading-none">{awayOutcomes.desviado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-lato text-[15px] font-bold text-white uppercase">Pér:</span>
                <span className="text-[16px] font-black text-white leading-none">{awayOutcomes.perdida}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectorRectangle: React.FC<{
  label: string;
  teamColor: string;
  stats: Record<string, number>;
  sectors: string[];
  borderPosition?: 'top' | 'bottom';
  type?: 'area' | 'zone23';
}> = ({ label, teamColor, stats, sectors, borderPosition, type }) => {
  const values = sectors.map(s => stats[s] || 0);
  const maxVal = values.length > 0 ? Math.max(...values) : -1;
  const isMax = (val: number) => val > 0 && val === maxVal;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">{label}</p>
      <div className={`w-full overflow-hidden flex flex-col ${borderPosition === 'top' ? 'flex-col-reverse' : 'flex-col'}`}>
        <div
          className={`w-full h-12 bg-white/5 border border-white/10 flex overflow-hidden ${type === 'zone23'
            ? 'rounded-none'
            : borderPosition === 'top' ? 'rounded-b-[40px] rounded-t-md' : 'rounded-t-[40px] rounded-b-md'
            }`}
          style={type === 'zone23' ? {
            borderTopStyle: borderPosition === 'bottom' ? 'dashed' : undefined,
            borderTopWidth: borderPosition === 'bottom' ? '2px' : undefined,
            borderBottomStyle: borderPosition === 'top' ? 'dashed' : undefined,
            borderBottomWidth: borderPosition === 'top' ? '2px' : undefined,
          } : undefined}
        >
          {sectors.map((sect, index) => {
            const val = stats[sect] || 0;
            const active = isMax(val);

            // Determinar clases de curvas para las celdas de los extremos
            let cellRoundedClass = '';
            if (type !== 'zone23') {
              if (borderPosition === 'top') {
                if (index === 0) cellRoundedClass = 'rounded-bl-[40px]';
                if (index === sectors.length - 1) cellRoundedClass = 'rounded-br-[40px]';
              } else {
                if (index === 0) cellRoundedClass = 'rounded-tl-[40px]';
                if (index === sectors.length - 1) cellRoundedClass = 'rounded-tr-[40px]';
              }
            }

            return (
              <div
                key={sect}
                className={`flex-1 border-r last:border-r-0 border-white/10/20 flex flex-col items-center justify-center transition-all ${cellRoundedClass} ${active ? 'bg-primary/10' : ''}`}
              >
                <span className={`text-[16px] font-black ${active ? 'text-primary' : 'text-white'}`}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getActionIcon = (type: string) => {
  const t = type.toUpperCase();
  if (t.includes('CÓRNER CORTO')) return (<i className="fa-hockey-puck fa-solid text-white"></i>);
  if (t.includes('PENAL')) return (<i className="fa-bullseye fa-solid text-white"></i>);
  if (t.includes('GOL')) return (<i className="fa-futbol fa-solid text-white"></i>);
  if (t.includes('DISPARO') || t.includes('ATAJADO') || t.includes('DESVIADO')) return (<i className="fa-futbol fa-solid text-white"></i>);
  if (t.includes('FALTA')) return '⚠️';
  if (t.includes('PÉRDIDA')) return (<i className="fa-arrow-trend-down fa-solid text-white"></i>);
  if (t.includes('RECUPERO')) return (<i className="fa-arrow-trend-up fa-solid text-white"></i>);
  if (t.includes('INGRESO')) return (<i className="fa-arrow-right-to-bracket fa-solid text-white"></i>);
  return (<i className="fa-thumbtack fa-solid text-white"></i>);
};

interface ActionButton {
  id: string;
  name: string;
  shortName: string;
  type: string;
  icon: string;
  nextPossession?: 'SAME' | 'OPPOSITE';
  details?: string;
}

interface ActionCategory {
  id: string;
  name: string;
  icon: string;
  buttons: ActionButton[];
}

const actionsSchema: {
  [key: string]: {
    local: ActionCategory[];
    visitante: ActionCategory[];
  };
} = {
  HOME: {
    local: [
      {
        id: 'remate',
        name: 'Remate al arco rival',
        icon: 'fa-solid fa-crosshairs',
        buttons: [
          { id: 'remate_atajado', name: 'Atajado', shortName: 'Ataj.', type: 'DISPARO_ATAJADO', icon: 'fa-solid fa-hand' },
          { id: 'remate_desviado', name: 'Desviado', shortName: 'Desv.', type: 'DISPARO_DESVIADO', icon: 'fa-solid fa-xmark' },
          { id: 'remate_gol', name: 'Gol', shortName: 'Gol', type: 'DISPARO_GOL', icon: 'fa-solid fa-futbol' }
        ]
      },
      {
        id: 'ingreso_area',
        name: 'Ingreso al área rival',
        icon: 'fa-solid fa-arrow-right-to-bracket',
        buttons: [
          { id: 'area_jugada', name: 'Jugada', shortName: 'Jug.', type: 'Ingreso en área', details: 'Jugada', icon: 'fa-solid fa-people-group' },
          { id: 'area_pase', name: 'Pase', shortName: 'Pase', type: 'Ingreso en área', details: 'Pase', icon: 'fa-solid fa-magnifying-glass-arrow-right' },
          { id: 'area_despeje', name: 'Despeje', shortName: 'Desp.', type: 'Ingreso en área', details: 'Despeje', icon: 'fa-solid fa-up-right-from-square' }
        ]
      },
      {
        id: 'ingreso_23',
        name: 'Ingreso a 23 yardas rival',
        icon: 'fa-solid fa-bezier-curve',
        buttons: [
          { id: '23_jugada', name: 'Jugada', shortName: 'Jug.', type: 'Ingreso en 23', details: 'Jugada', icon: 'fa-solid fa-people-group' },
          { id: '23_pase', name: 'Pase', shortName: 'Pase', type: 'Ingreso en 23', details: 'Pase', icon: 'fa-solid fa-magnifying-glass-arrow-right' },
          { id: '23_despeje', name: 'Despeje', shortName: 'Desp.', type: 'Ingreso en 23', details: 'Despeje', icon: 'fa-solid fa-up-right-from-square' }
        ]
      },
      {
        id: 'faltas_recibidas',
        name: 'Faltas recibidas',
        icon: 'fa-solid fa-hand-paper',
        buttons: [
          { id: 'falta_tarjeta', name: 'Tarjeta a rival', shortName: 'Tarj.', type: 'FALTA_TARJETA', icon: 'fa-solid fa-diamond' },
          { id: 'falta_corto', name: 'Córner corto', shortName: 'CC', type: 'CÓRNER CORTO', icon: 'fa-solid fa-flag' },
          { id: 'falta_penal', name: 'Penal', shortName: 'Penal', type: 'PENAL', icon: 'fa-solid fa-bullseye' }
        ]
      }
    ],
    visitante: [
      {
        id: 'perdida',
        name: 'Pérdida',
        icon: 'fa-solid fa-arrow-trend-down',
        buttons: [
          { id: 'perdida_falta', name: 'Falta', shortName: 'Falta', type: 'PÉRDIDA_FALTA', icon: 'fa-solid fa-hand-fist', nextPossession: 'OPPOSITE' },
          { id: 'perdida_quite', name: 'Quite', shortName: 'Quite', type: 'PÉRDIDA_QUITE', icon: 'fa-solid fa-shield-halved', nextPossession: 'OPPOSITE' },
          { id: 'perdida_interc', name: 'Intercepción', shortName: 'Interc.', type: 'PÉRDIDA_INTERCEPCIÓN', icon: 'fa-solid fa-bolt', nextPossession: 'OPPOSITE' },
          { id: 'perdida_afuera', name: 'Afuera', shortName: 'Afuera', type: 'PÉRDIDA_AFUERA', icon: 'fa-solid fa-arrow-right-from-bracket', nextPossession: 'OPPOSITE' }
        ]
      }
    ]
  },
  AWAY: {
    local: [
      {
        id: 'recupero',
        name: 'Recupero',
        icon: 'fa-solid fa-arrow-trend-up',
        buttons: [
          { id: 'recupero_falta', name: 'Falta', shortName: 'Falta', type: 'RECUPERO_FALTA', icon: 'fa-solid fa-hand-fist', nextPossession: 'OPPOSITE' },
          { id: 'recupero_quite', name: 'Quite', shortName: 'Quite', type: 'RECUPERO_QUITE', icon: 'fa-solid fa-shield-halved', nextPossession: 'OPPOSITE' },
          { id: 'recupero_interc', name: 'Intercepción', shortName: 'Interc.', type: 'RECUPERO_INTERCEPCIÓN', icon: 'fa-solid fa-bolt', nextPossession: 'OPPOSITE' },
          { id: 'recupero_afuera', name: 'Afuera', shortName: 'Afuera', type: 'RECUPERO_AFUERA', icon: 'fa-solid fa-arrow-right-from-bracket', nextPossession: 'OPPOSITE' }
        ]
      }
    ],
    visitante: [
      {
        id: 'remate_mi_arco',
        name: 'Remate a mi arco',
        icon: 'fa-solid fa-crosshairs',
        buttons: [
          { id: 'mi_arco_atajado', name: 'Atajado', shortName: 'Ataj.', type: 'DISPARO_RIVAL_ATAJADO', icon: 'fa-solid fa-hand' },
          { id: 'mi_arco_desviado', name: 'Desviado', shortName: 'Desv.', type: 'DISPARO_RIVAL_DESVIADO', icon: 'fa-solid fa-xmark' },
          { id: 'mi_arco_gol', name: 'Gol', shortName: 'Gol', type: 'DISPARO_RIVAL_GOL', icon: 'fa-solid fa-futbol' }
        ]
      },
      {
        id: 'ingreso_mi_area',
        name: 'Ingreso a mi área',
        icon: 'fa-solid fa-arrow-right-to-bracket',
        buttons: [
          { id: 'mi_area_jugada', name: 'Jugada', shortName: 'Jug.', type: 'Ingreso Rival en área', details: 'Jugada', icon: 'fa-solid fa-people-group' },
          { id: 'mi_area_pase', name: 'Pase', shortName: 'Pase', type: 'Ingreso Rival en área', details: 'Pase', icon: 'fa-solid fa-magnifying-glass-arrow-right' },
          { id: 'mi_area_despeje', name: 'Despeje', shortName: 'Desp.', type: 'Ingreso Rival en área', details: 'Despeje', icon: 'fa-solid fa-up-right-from-square' }
        ]
      },
      {
        id: 'ingreso_mis_23',
        name: 'Ingreso a mis 23 yardas',
        icon: 'fa-solid fa-bezier-curve',
        buttons: [
          { id: 'mi_23_jugada', name: 'Jugada', shortName: 'Jug.', type: 'Ingreso rival en 23', details: 'Jugada', icon: 'fa-solid fa-people-group' },
          { id: 'mi_23_pase', name: 'Pase', shortName: 'Pase', type: 'Ingreso rival en 23', details: 'Pase', icon: 'fa-solid fa-magnifying-glass-arrow-right' },
          { id: 'mi_23_despeje', name: 'Despeje', shortName: 'Desp.', type: 'Ingreso rival en 23', details: 'Despeje', icon: 'fa-solid fa-up-right-from-square' }
        ]
      },
      {
        id: 'faltas_cometidas',
        name: 'Faltas cometidas',
        icon: 'fa-solid fa-hand-paper',
        buttons: [
          { id: 'falta_tarjeta_recibida', name: 'Tarjeta recibida', shortName: 'Tarj.', type: 'FALTA_TARJETA_RECIBIDA', icon: 'fa-solid fa-diamond' },
          { id: 'falta_corto_cometida', name: 'Córner corto', shortName: 'CC', type: 'FALTA COMETIDA (CÓRNER CORTO)', icon: 'fa-solid fa-flag' },
          { id: 'falta_penal_cometida', name: 'Penal', shortName: 'Penal', type: 'FALTA COMETIDA (PENAL)', icon: 'fa-solid fa-bullseye' }
        ]
      }
    ]
  }
};

const LiveGameView: React.FC<{
  role: UserRole,
  tacticalSchemes: TacticalScheme[],
  onUpdateTactics: (tactics: TacticalScheme[]) => void,
  onExitGame: (game: Game) => void,
  onAnnulGame: () => void
}> = ({ role, tacticalSchemes, onUpdateTactics, onExitGame, onAnnulGame }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const isPressMode = role === UserRole.PRESS || game?.role === UserRole.PRESS || game?.role === 'press';
  const [selectedLane, setSelectedLane] = useState<'left' | 'center' | 'right'>('center');
  const [selectedZone, setSelectedZone] = useState<'rival' | 'own'>('rival');
  const [dbAcciones, setDbAcciones] = useState<any[]>([]);

  useEffect(() => {
    const fetchAcciones = async () => {
      try {
        // Apuntamos directamente a la nueva colección y al documento estructurado del deporte
        const docRef = doc(db, 'config_deportes', 'hockey_cesped');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Guardamos el objeto completo (con sus modos, categorías y botones hijos)
          setDbAcciones(data);
        } else {
          console.warn("No se encontró el documento de configuración en /config_deportes/hockey_cesped");
        }
      } catch (err) {
        console.error('Error al recuperar las acciones dinámicas de Firestore:', err);
      }
    };

    fetchAcciones();
  }, []);

  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [possession, setPossession] = useState<Possession>(Possession.NONE);
  const [passCount, setPassCount] = useState(0);
  const [foulPlayer, setFoulPlayer] = useState('');
  const [foulMinutes, setFoulMinutes] = useState('');
  const [showPopup, setShowPopup] = useState<{ x: number, y: number, type: 'FOUL' | 'SHOT' | 'CORTO_PENAL', targetGoal?: 'TOP' | 'BOTTOM' } | null>(null);
  const [feedback, setFeedback] = useState<{ id: string, x: number, y: number, text: string, icon: string, fading: boolean } | null>(null);

  useEffect(() => {
    if (feedback && !feedback.fading) {
      const fadeTimer = setTimeout(() => {
        setFeedback(prev => prev ? { ...prev, fading: true } : null);
      }, 600);
      const removeTimer = setTimeout(() => {
        setFeedback(null);
      }, 1000);
      return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
    }
  }, [feedback]);

  // Modal de detalles de gol (Unificado)
  const [goalType, setGoalType] = useState<'Individual' | 'Colectiva' | 'Penal' | 'Corto' | null>(null);

  const [activeView, setActiveView] = useState<'field' | 'list' | 'tactics' | 'stats'>('field');

  const [eventFilter, setEventFilter] = useState<ActionFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [period, setPeriod] = useState(1);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [periodToConfirm, setPeriodToConfirm] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [undoModal, setUndoModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<GameEvent | null>(null);
  const [atajadoSelected, setAtajadoSelected] = useState(false);
  const [localPossessionTime, setLocalPossessionTime] = useState(0);
  const [awayPossessionTime, setAwayPossessionTime] = useState(0);
  const [foulCardType, setFoulCardType] = useState<'NONE' | 'VERDE' | 'AMARILLA' | 'ROJA'>('NONE');
  const [activeTacticId, setActiveTacticId] = useState<string | null>(null);
  const [expandedTacticId, setExpandedTacticId] = useState<string | null>(null);
  const [showNewTacticForm, setShowNewTacticForm] = useState(false);
  const [newTactic, setNewTactic] = useState({ name: '', description: '', objective: '' });

  // Estados para el Modo Periodista (press)
  const [showStartersModal, setShowStartersModal] = useState<'local' | 'visitante' | null>(null);
  const [activeActionForAssign, setActiveActionForAssign] = useState<{ team: 'local' | 'visitante'; cardId: 'disparo_arco' | 'tarjetas'; subActionId: string; metadata?: any } | null>(null);
  const [activeFoul, setActiveFoul] = useState<{ team: 'local' | 'visitante'; type: 'committed' | 'received'; subAction: string } | null>(null);
  const [selectedFoulPlayer, setSelectedFoulPlayer] = useState<string | null>(null);
  const [selectedFoulCard, setSelectedFoulCard] = useState<'verde' | 'amarilla' | 'roja' | null>(null);
  const [selectedFoulFija, setSelectedFoulFija] = useState<'corner_corto' | 'penal' | null>(null);


  // Estados de orientación de la cancha
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingActiveGame, setPendingActiveGame] = useState<any>(null);
  const [syncQueueLength, setSyncQueueLength] = useState(PersistenceManager.getSyncQueueLength());
  const [orientationTrigger, setOrientationTrigger] = useState(0);

  useEffect(() => {
    const handleResize = () => setOrientationTrigger(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      setSyncQueueLength(PersistenceManager.getSyncQueueLength());
    }, 3000); // Check sync status every 3 seconds
    return () => clearInterval(syncInterval);
  }, []);
  const [showActionListCentral, setShowActionListCentral] = useState(false);
  const [lastSecondaryAction, setLastSecondaryAction] = useState<string | null>(null);
  const [possessionExpanded, setPossessionExpanded] = useState(true);
  const [shotsOwnExpanded, setShotsOwnExpanded] = useState(true);
  const [shotsRivalExpanded, setShotsRivalExpanded] = useState(true);
  const [possessionSidebarExpanded, setPossessionSidebarExpanded] = useState(true);
  const [shotsTotalSidebarExpanded, setShotsTotalSidebarExpanded] = useState(true);

  const [selectedShotAction, setSelectedShotAction] = useState<'GOL' | 'ATAJADO' | 'DESVIADO' | null>(null);
  const [atajadoPossession, setAtajadoPossession] = useState<'MANTIENE' | 'PIERDE' | null>(null);

  const timerRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (id) {
      setIsLoading(true);
      setLoadError(null);

      // Fail-safe de 5 segundos
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setLoadError('Hubo un problema al cargar los datos. El tiempo de espera se agotó.');
        console.error("Error al recuperar partido: Timeout de 5 segundos excedido");
      }, 5000);

      try {
        const activeGame = StorageService.getActiveGame();

        if (activeGame) {
          setPendingActiveGame(activeGame);
          setShowResumePrompt(true);
          setIsLoading(false);
          clearTimeout(timeoutId);
        } else {
          // Load fresh from DB if not active locally
          const data = PersistenceManager.getGame(id);
          if (data) {
            setGame(data);
            if (data.activeTacticId) setActiveTacticId(data.activeTacticId);
            setIsLoading(false);
            clearTimeout(timeoutId);
          } else {
            console.error(`Error al recuperar partido: No se encontró el juego con id ${id}`);
            setLoadError('No se encontró el partido solicitado en el dispositivo.');
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        }
      } catch (err: any) {
        console.error("Error al recuperar partido:", err);
        setLoadError(`Data corrupta o error al leer almacenamiento: ${err.message}`);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [id]);

  // Autosave current match to StorageService in real-time
  useEffect(() => {
    if (game && id) {
      StorageService.saveActiveGame({
        game,
        seconds,
        period,
        possession,
        localPossessionTime,
        awayPossessionTime,
        passCount,
        isRunning
      });
    }
  }, [game, seconds, period, possession, localPossessionTime, awayPossessionTime, passCount, isRunning, id]);

  // Populate local and visitor starters metadata automatically with the first 11 players if empty when role is UserRole.PRESS
  useEffect(() => {
    if (isPressMode && game) {
      let updated = false;
      const metadata = game.metadata || {
        torneo: '',
        jornada: '',
        rama: '',
        categoria: '',
        estadio: '',
        hora: '',
        arbitros: '',
        localPlayers: game.teamHome.players || [],
        visitantePlayers: game.teamAway.players || [],
        localStarters: [],
        visitanteStarters: []
      };

      const localStarters = metadata.localStarters || [];
      const visitanteStarters = metadata.visitanteStarters || [];

      let newLocalStarters = [...localStarters];
      if (localStarters.length === 0 && game.teamHome.players && game.teamHome.players.length > 0) {
        newLocalStarters = game.teamHome.players.slice(0, 11).map(p => p.id);
        updated = true;
      }

      let newVisitanteStarters = [...visitanteStarters];
      if (visitanteStarters.length === 0 && game.teamAway.players && game.teamAway.players.length > 0) {
        newVisitanteStarters = game.teamAway.players.slice(0, 11).map(p => p.id);
        updated = true;
      }

      if (updated) {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            metadata: {
              ...metadata,
              localStarters: newLocalStarters,
              visitanteStarters: newVisitanteStarters
            }
          };
        });
      }
    }
  }, [role, game?.id]);

  // PersistenceManager.updateGame in real-time has been removed to reduce Firebase writes.

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isRunning) {
        if (possession === Possession.HOME) {
          setLocalPossessionTime(prev => prev + 1);
        } else if (possession === Possession.AWAY) {
          setAwayPossessionTime(prev => prev + 1);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, possession]);

  useEffect(() => {
    if (!showPopup) {
      setAtajadoSelected(false);
      setSelectedShotAction(null);
      setAtajadoPossession(null);
      setFoulPlayer('');
      setFoulMinutes('');
      setGoalType(null);
    }
  }, [showPopup]);

  // Analytics for area/23 entries
  const { statsArea, stats23 } = React.useMemo(() => {
    const statsArea = {
      home: { 'Extremo Derecho': 0, 'Centro Derecha': 0, 'Centro': 0, 'Centro Izquierda': 0, 'Extremo Izquierdo': 0 },
      away: { 'Extremo Derecho': 0, 'Centro Derecha': 0, 'Centro': 0, 'Centro Izquierda': 0, 'Extremo Izquierdo': 0 }
    };
    const stats23 = {
      home: { 'Derecha': 0, 'Centro': 0, 'Izquierda': 0 },
      away: { 'Derecha': 0, 'Centro': 0, 'Izquierda': 0 }
    };

    if (!game?.events) return { statsArea, stats23 };

    const periodEvents = game.events.filter(e => {
      if (periodFilter === 'ALL') return true;
      return e.gameTime.startsWith(`${periodFilter}Q`);
    });

    periodEvents.forEach(e => {
      const type = (e.type || "").toLowerCase();
      const details = (e.details || "").toLowerCase();

      if (type.includes('ingreso')) {
        const isHomeEntry = !type.includes('rival');

        if (type.includes('área')) {
          // Usamos .find() con un orden específico para evitar colisiones de sub-strings (ej: 'Centro' dentro de 'Centro Derecha')
          const areaSectors = ['Extremo Derecho', 'Centro Derecha', 'Centro Izquierda', 'Extremo Izquierdo', 'Centro'];
          const matchedSector = areaSectors.find(sect => details.toLowerCase().includes(sect.toLowerCase()));

          if (matchedSector) {
            if (isHomeEntry) statsArea.home[matchedSector as keyof typeof statsArea.home]++;
            else statsArea.away[matchedSector as keyof typeof statsArea.away]++;
          }
        } else if (type.includes('23')) {
          ['Derecha', 'Centro', 'Izquierda'].forEach(lane => {
            if (details.includes(lane.toLowerCase())) {
              if (isHomeEntry) stats23.home[lane as keyof typeof stats23.home]++;
              else stats23.away[lane as keyof typeof stats23.away]++;
            }
          });
        }
      }
    });

    return { statsArea, stats23 };
  }, [game?.events, periodFilter]);

  // Early returns removed to ensure layout is ALWAYS rendered

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const toggleTimer = () => {
    if (!isRunning && possession === Possession.NONE) {
      setSnackbar({
        message: "Por favor, selecciona qué equipo inicia con la posesión para comenzar el partido",
        visible: true
      });
      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 3500);
      return;
    }
    setIsRunning(!isRunning);
  };

  const selectPossession = (p: Possession) => {
    if (isRunning) return;
    setPossession(p);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const getSectorInfo = (x: number, y: number): { half: 'own' | 'rival', lane: 'left' | 'center' | 'right' } => {
    const half = y > 50 ? 'own' : 'rival';
    let lane: 'left' | 'center' | 'right' = 'center';
    if (x < 33) lane = 'left';
    else if (x > 66) lane = 'right';
    return { half, lane };
  };

  const handlePeriodRequest = (newPeriod: number) => {
    if (newPeriod === period) {
      setShowPeriodMenu(false);
      return;
    }
    setPeriodToConfirm(newPeriod);
    setShowPeriodMenu(false);
  };

  const confirmPeriodChange = () => {
    if (periodToConfirm !== null) {
      setPeriod(periodToConfirm);
      setSeconds(0);
      setIsRunning(false);
      setPossession(Possession.NONE);
      setSnackbar({ message: `Iniciado ${periodToConfirm}Q. Cronómetro a 0:00. Selecciona posesión inicial.`, visible: true });
      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 3000);
      setPeriodToConfirm(null);
      setPassCount(0);
    }
  };

  const showPassSnackbar = (count: number, isRecord: boolean) => {
    if (!isRecord) return;
    const message = `<i className="fa-solid fa-trophy"></i> ¡Nuevo récord: ${count} pases!`;
    setSnackbar({ message, visible: true });
    setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2500);
  };

  const handlePitchAction = (type: string, nextPoss: Possession, x: number, y: number, details?: string) => {
    if (type === 'FALTA A FAVOR EN 23') {
      // nextPoss is the attacking team side (swipe direction)
      const attacker = nextPoss;
      const defender = attacker === Possession.HOME ? Possession.AWAY : Possession.HOME;

      // If defender currently has possession, they "lose" it
      const defenderHadPossession = possession === defender;
      const actionType = defenderHadPossession ? 'FALTA COMETIDA / PÉRDIDA' : 'FALTA COMETIDA';

      // Register the foul for the defender
      registerEvent(actionType, attacker, x, y, `Falta en zona 23y / Área (Provoca C.Corto/Penal)`, defender === Possession.HOME ? game.teamHome.id : game.teamAway.id);

      setShowPopup({ x, y, type: 'CORTO_PENAL' });
      return;
    }

    if (type === 'Falta Cometida') {
      // Determine the team committing the foul
      // If nextPoss is same as current possession, the rival committed it
      // If nextPoss is different, the team in possession committed it (loses possession)
      const committingTeamPoss = nextPoss === possession
        ? (possession === Possession.HOME ? Possession.AWAY : Possession.HOME)
        : possession;

      const committingTeamId = committingTeamPoss === Possession.HOME ? game.teamHome.id : game.teamAway.id;

      // Register event with the specific committing team
      registerEvent(type, nextPoss, x, y, details, committingTeamId);
      setShowPopup({ x, y, type: 'FOUL' });
      return;
    }

    if (type === 'DISPARO') {
      const targetGoal = y < 50 ? 'TOP' : 'BOTTOM';
      setShowPopup({ x, y, type: 'SHOT', targetGoal });
      setAtajadoSelected(false);
      if (lastSecondaryAction) {
        if (lastSecondaryAction.includes('CÓRNER CORTO')) setGoalType('Corto');
        else if (lastSecondaryAction.includes('PENAL')) setGoalType('Penal');
        else setGoalType(null);
      } else {
        setGoalType(null);
      }
    }
    registerEvent(type, nextPoss, x, y, details);
  };

  const handleTacticalButtonClick = (btn: ActionButton) => {
    if (!game) return;
    if (!isRunning) {
      setSnackbar({ message: "Inicia el cronómetro para registrar acciones", visible: true });
      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2500);
      return;
    }

    let lx = 50;
    if (selectedLane === 'left') lx = 16;
    else if (selectedLane === 'right') lx = 83;

    let ly = 50;
    if (selectedZone === 'rival') ly = 25;
    else if (selectedZone === 'own') ly = 75;

    const laneName = selectedLane === 'left' ? 'Izquierda' : selectedLane === 'right' ? 'Derecha' : 'Centro';
    const zoneName = selectedZone === 'rival' ? 'Rival' : 'Propio';
    const sectorStr = `Botones: Campo ${zoneName} - ${laneName}`;

    let finalType = btn.type;
    let finalPoss = possession;

    // Normalizaciones para alineación con las estadísticas existentes
    if (btn.type === 'Ingreso en área') {
      finalType = possession === Possession.HOME ? 'Ingreso en área' : 'Ingreso Rival en área';
    } else if (btn.type === 'Ingreso en 23') {
      finalType = possession === Possession.HOME ? 'Ingreso en 23' : 'Ingreso rival en 23';
    }

    // Lógica para Remates (DISPAROS)
    if (btn.type.startsWith('DISPARO_') || btn.type.startsWith('DISPARO_RIVAL_')) {
      const isRivalShot = btn.type.startsWith('DISPARO_RIVAL_');
      const targetGoal = ly < 50 ? 'TOP' : 'BOTTOM';

      let outcome: 'GOL' | 'ATAJADO' | 'DESVIADO' = 'GOL';
      if (btn.type.includes('GOL')) outcome = 'GOL';
      else if (btn.type.includes('ATAJADO')) outcome = 'ATAJADO';
      else if (btn.type.includes('DESVIADO')) outcome = 'DESVIADO';

      const baseType = isRivalShot ? 'DISPARO RIVAL' : 'DISPARO';
      registerEvent(baseType, finalPoss, lx, ly, sectorStr);

      setSelectedShotAction(outcome);
      setGoalType(null);
      setFoulPlayer('');
      setAtajadoPossession(null);
      setAtajadoSelected(outcome === 'ATAJADO');

      setShowPopup({ x: lx, y: ly, type: 'SHOT', targetGoal });
      return;
    }

    // Lógica de Faltas y Tarjetas
    if (btn.type === 'FALTA_TARJETA') {
      // Local recibe falta (Visitante la comete)
      registerEvent('Falta Cometida', Possession.HOME, lx, ly, `Tarjeta a rival | ${sectorStr}`, game.teamAway.id);
      setShowPopup({ x: lx, y: ly, type: 'FOUL' });
      return;
    }
    if (btn.type === 'FALTA_TARJETA_RECIBIDA') {
      // Local comete falta
      registerEvent('Falta Cometida', Possession.AWAY, lx, ly, `Tarjeta recibida | ${sectorStr}`, game.teamHome.id);
      setShowPopup({ x: lx, y: ly, type: 'FOUL' });
      return;
    }

    // Faltas con conmutación o eventos directos
    if (btn.type === 'CÓRNER CORTO' || btn.type === 'PENAL') {
      registerEvent(btn.type, Possession.HOME, lx, ly, `${btn.name} a Favor | ${sectorStr}`, game.teamHome.id);
      return;
    }
    if (btn.type === 'FALTA COMETIDA (CÓRNER CORTO)') {
      registerEvent('CÓRNER CORTO', Possession.HOME, lx, ly, `Córner Corto a Favor (Cometido por rival) | ${sectorStr}`, game.teamAway.id);
      setPossession(Possession.HOME);
      return;
    }
    if (btn.type === 'FALTA COMETIDA (PENAL)') {
      registerEvent('PENAL', Possession.HOME, lx, ly, `Penal a Favor (Cometido por rival) | ${sectorStr}`, game.teamAway.id);
      setPossession(Possession.HOME);
      return;
    }

    // Pérdidas (Scenario A)
    if (btn.type.startsWith('PÉRDIDA_')) {
      let lossDetails = `Pérdida por ${btn.name} | ${sectorStr}`;
      if (btn.type === 'PÉRDIDA_FALTA') {
        registerEvent('Falta Cometida', Possession.AWAY, lx, ly, lossDetails, game.teamHome.id);
      } else {
        registerEvent('PÉRDIDA', Possession.AWAY, lx, ly, lossDetails, game.teamHome.id);
      }
      setPossession(Possession.AWAY);
      return;
    }

    // Recuperos (Scenario B)
    if (btn.type.startsWith('RECUPERO_')) {
      let recoveryDetails = `Recupero por ${btn.name} | ${sectorStr}`;
      if (btn.type === 'RECUPERO_FALTA') {
        registerEvent('Falta Cometida', Possession.HOME, lx, ly, recoveryDetails, game.teamAway.id);
      } else {
        registerEvent('RECUPERO', Possession.HOME, lx, ly, recoveryDetails, game.teamHome.id);
      }
      setPossession(Possession.HOME);
      return;
    }

    registerEvent(finalType, finalPoss, lx, ly, sectorStr);
  };

  const renderActionButton = (btn: ActionButton, teamColor: string) => {
    return (
      <button
        key={btn.id}
        onClick={() => handleTacticalButtonClick(btn)}
        className="group relative flex flex-col items-center justify-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-center min-h-[46px] select-none w-full shadow-sm"
        style={{ '--hover-color': teamColor } as React.CSSProperties}
      >
        <i className={`${btn.icon} text-[#38bdf8] group-hover:text-white text-[15px] sm:text-[17px] transition-colors`}></i>
        <span className="text-[8px] sm:text-[9px] font-black text-white/70 group-hover:text-white uppercase tracking-wider leading-none">
          <span className="hidden sm:inline">{btn.name}</span>
          <span className="inline sm:hidden">{btn.shortName}</span>
        </span>
      </button>
    );
  };

  const handleManualMenu = (x: number, y: number) => {
    setShowPopup({ x, y, type: 'FOUL' });
  };

  const registerEvent = (
    type: string,
    nextPoss: Possession,
    x: number,
    y: number,
    details?: string,
    forcedTeamId?: string,
    scoringTeam?: Possession,
    audioData?: string,
    pressPlayerName?: string | null,
    pressAction?: string,
    pressTeam?: 'local' | 'visitante'
  ) => {
    const eventId = Math.random().toString(36).substr(2, 5);

    if (game) {
      const attackingTeamId = possession === Possession.HOME ? game.teamHome.id : game.teamAway.id;
      const eventTeamId = forcedTeamId || ((type.toUpperCase().includes('DISPARO') || type.toUpperCase().includes('GOL') || type.toUpperCase().includes('PÉRDIDA')) ? attackingTeamId : (nextPoss === Possession.HOME ? game.teamHome.id : game.teamAway.id));
      const currentCount = game.events.filter(e => e.type === type && e.teamId === eventTeamId).length + 1;

      setFeedback({
        id: eventId,
        x,
        y,
        text: `${type} (${currentCount})`,
        icon: getActionIcon(type),
        fading: false
      });
    }

    setGame(prev => {
      if (!prev) return prev;

      let finalDetails = details || "";
      let updatedPassChains = [...prev.passChains];
      const currentMax = prev.passChains.length > 0 ? Math.max(...prev.passChains) : 0;

      const isChainBreaker = type.includes('FALTA') || type.includes('PÉRDIDA') || type.includes('GOL') || type.includes('DESVIADO') || type === 'RECUPERO' || type === 'DISPARO';

      if (isChainBreaker && passCount > 0) {
        updatedPassChains.push(passCount);
        const isNewRecord = passCount > currentMax;
        showPassSnackbar(passCount, isNewRecord);
        finalDetails = `${finalDetails}${finalDetails ? ' | ' : ''}(${passCount} pases)`;
        setPassCount(0);
      }

      const attackingTeamId = possession === Possession.HOME ? prev.teamHome.id : prev.teamAway.id;
      const eventTeamId = forcedTeamId || ((type.toUpperCase().includes('DISPARO') || type.toUpperCase().includes('GOL') || type.toUpperCase().includes('PÉRDIDA')) ? attackingTeamId : (nextPoss === Possession.HOME ? prev.teamHome.id : prev.teamAway.id));

      const sector = getSectorInfo(x, y);

      const event: GameEvent = {
        id: eventId,
        timestamp: Date.now(),
        gameTime: `${period}Q ${formatTime(seconds)}`,
        type,
        teamId: eventTeamId,
        x: Math.round(x),
        y: Math.round(y),
        half: sector.half,
        lane: sector.lane,
        details: finalDetails,
        comment: undefined,
        audioData: audioData,
        scoringTeam: scoringTeam,
        tacticId: activeTacticId || undefined,
        prevPossession: possession, // Store current before applying nextPoss
        player: pressPlayerName,
        action: pressAction,
        team: pressTeam,
        period: period,
        timestampStr: formatTime(seconds)
      };

      let updatedScoreHome = prev.scoreHome;
      let updatedScoreAway = prev.scoreAway;

      if (type.includes('GOL')) {
        if (scoringTeam === Possession.HOME) updatedScoreHome++;
        else if (scoringTeam === Possession.AWAY) updatedScoreAway++;
      }

      return {
        ...prev,
        scoreHome: updatedScoreHome,
        scoreAway: updatedScoreAway,
        events: [...prev.events, event],
        passChains: updatedPassChains,
        activeTacticId: activeTacticId || undefined
      };
    });

    if (nextPoss !== Possession.NONE) setPossession(nextPoss);

    // Track secondary actions for gol formatting
    if (type.includes('CÓRNER CORTO') || type.includes('PENAL')) {
      setLastSecondaryAction(type);
    } else if (!type.includes('DISPARO') && !type.includes('GOL')) {
      // If it's a different action (like a loss or recovery), reset the preceding action
      // However, usually we only reset if it's a clear possession end or something.
      // For now, let's only reset if it's NOT a shot/goal.
      setLastSecondaryAction(null);
    }

    // Solo cerrar el popup si no es una acción que requiere submenú inmediato
    if (type !== 'DISPARO' && type !== 'Falta Cometida' && !type.includes('FAVOR EN 23')) {
      setShowPopup(null);
    }

    // Si es una nota de voz, iniciar transcripción
    if (type === 'NOTA VOZ' && audioData) {
      handleTranscription(eventId, audioData);
    }
  };

  const handleTranscription = async (eventId: string, audioData: string) => {
    updateEventStatus(eventId, true);
    try {
      const text = await aiService.transcribeAudio(audioData);
      updateEventTranscription(eventId, text);
    } catch (err: any) {
      console.error("Transcription failed", err);
      updateEventStatus(eventId, false, `Error: ${err.message || "Falla técnica"}`);
    }
  };

  const handleAddTactic = (activate: boolean = false) => {
    const userId = game?.ownerId || game?.userId;
    if (!newTactic.name || !userId) return;
    const tactic: TacticalScheme = {
      id: Math.random().toString(36).substr(2, 9),
      ownerId: userId,
      ...newTactic
    };
    const updatedTactics = [...tacticalSchemes, tactic];
    onUpdateTactics(updatedTactics);

    if (activate) {
      setActiveTacticId(tactic.id);
      setActiveView('field');
    }

    setNewTactic({ name: '', description: '', objective: '' });
    setShowNewTacticForm(false);
  };

  const updateEventStatus = (eventId: string, isTranscribing: boolean, details?: string) => {
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map(e => e.id === eventId ? { ...e, isTranscribing, details: details || e.details } : e)
      };
    });
  };

  const updateEventTranscription = (eventId: string, text: string) => {
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map(e => e.id === eventId ? { ...e, transcription: text, isTranscribing: false } : e)
      };
    });
  };

  const updateEventDetails = (eventId: string, newDetails: string) => {
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map(e => e.id === eventId ? { ...e, details: newDetails, transcription: e.type === 'NOTA VOZ' ? newDetails : e.transcription } : e)
      };
    });
    setEventToEdit(null);
  };

  const updateLastEvent = (newType: string, newDetails: string, scoreUpdate?: { home: number, away: number }, nextPoss?: Possession) => {
    setGame(prev => {
      if (!prev || prev.events.length === 0) return prev;
      const updatedEvents = [...prev.events];
      const lastIdx = updatedEvents.length - 1;
      const lastEvent = updatedEvents[lastIdx];

      if (lastEvent.type.includes('FALTA') || lastEvent.type.includes('DISPARO') || lastEvent.type.includes('PÉRDIDA')) {
        updatedEvents[lastIdx] = {
          ...lastEvent,
          type: newType,
          details: newDetails
        };

        let newScoreHome = prev.scoreHome + (scoreUpdate?.home || 0);
        let newScoreAway = prev.scoreAway + (scoreUpdate?.away || 0);

        return {
          ...prev,
          events: updatedEvents,
          scoreHome: Math.max(0, newScoreHome),
          scoreAway: Math.max(0, newScoreAway)
        };
      }
      return prev;
    });

    if (nextPoss !== undefined) setPossession(nextPoss);

    // Clear lastSecondaryAction after it's been used to update an event (like when picking from menu)
    // unless the update was TO a secondary action
    if (newType.includes('CÓRNER CORTO') || newType.includes('PENAL')) {
      setLastSecondaryAction(newType);
    }

    setShowPopup(null);
    setFoulPlayer('');
    setFoulMinutes('');
    setFoulCardType('NONE');
  };

  const handleClosePopup = () => {
    if (showPopup?.type === 'SHOT') {
      if (game && game.events.length > 0 && game.events[game.events.length - 1].type === 'DISPARO') {
        deleteEvent(game.events[game.events.length - 1].id);
      }
    }
    setShowPopup(null);
    setFoulCardType('NONE');
  };

  const handleGoalConfirmation = (scoreUpdate: { home: number, away: number }, nextPoss: Possession) => {
    const authorStr = foulPlayer ? `#${foulPlayer}` : 'Jugador: N/A';
    const typeMap = {
      'Individual': 'J. Individual',
      'Colectiva': 'J. Colectiva',
      'Penal': 'Penal',
      'Corto': 'C. Corto'
    };
    const typeStr = goalType ? typeMap[goalType] : 'Tipo: No especificado';

    // Siempre registramos como DISPARO (GOL) para no duplicar el contador estadístico
    const eventType = 'DISPARO (GOL)';
    const finalDetails = `GOL${foulPlayer ? ` (#${foulPlayer})` : ''} | ${authorStr} | ${typeStr}`;

    updateLastEvent(eventType, finalDetails, scoreUpdate, nextPoss);
    setLastSecondaryAction(null); // Used, now clear it
    setGoalType(null);
  };

  const deleteEvent = (eventId: string) => {
    const eventToDelete = game.events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    let updatedScoreHome = game.scoreHome;
    let updatedScoreAway = game.scoreAway;

    if (eventToDelete.type.includes('GOL')) {
      const isHomeScoring = (eventToDelete.teamId === game.teamHome.id);
      if (isHomeScoring) updatedScoreHome--;
      else updatedScoreAway--;
    }

    const updatedGame = {
      ...game,
      scoreHome: Math.max(0, updatedScoreHome),
      scoreAway: Math.max(0, updatedScoreAway),
      events: game.events.filter(e => e.id !== eventId)
    };
    setGame(updatedGame);

    // Reverse possession if available AND it's the last event
    const isLastEvent = game.events.length > 0 && eventId === game.events[game.events.length - 1].id;
    if (isLastEvent && eventToDelete.prevPossession) {
      setPossession(eventToDelete.prevPossession);
    }
  };

  const getStat = (types: string[], teamId?: string) => {
    const targetTeamId = teamId || game.teamHome.id;
    return game.events.filter(e => {
      const isTeam = e.teamId === targetTeamId;
      const isTarget = types.some(t => e.type.toUpperCase().includes(t.toUpperCase()));
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return isTeam && isTarget && periodMatch;
    }).length;
  };

  const getDetailedStat = (types: string[], teamId?: string) => {
    const targetTeamId = teamId || game.teamHome.id;
    const events = game.events.filter(e => {
      const isTeam = e.teamId === targetTeamId;
      const isTarget = types.some(t => {
        return e.type.toUpperCase().includes(t.toUpperCase());
      });
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return isTeam && isTarget && periodMatch;
    });

    return {
      total: events.length,
      own: events.filter(e => e.half === 'own').length,
      rival: events.filter(e => e.half === 'rival').length,
      left: events.filter(e => e.lane === 'left').length,
      center: events.filter(e => e.lane === 'center').length,
      right: events.filter(e => e.lane === 'right').length,
      events // returning raw events for outcome analysis
    };
  };

  const handleVoiceNote = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            registerEvent('NOTA VOZ', Possession.NONE, 50, 50, "Audio guardado", game.teamHome.id, undefined, base64Audio);
          };
          stream.getTracks().forEach(track => track.stop());
          setSnackbar({ message: "Nota de voz guardada.", visible: true });
          setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        setSnackbar({ message: "Error al acceder al micrófono.", visible: true });
        setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handleSaveTextNote = () => {
    if (!noteText.trim()) return;
    registerEvent('NOTA TEXTO', Possession.NONE, 50, 50, noteText, game.teamHome.id);
    setNoteText('');
    setShowNoteModal(false);
  };

  const deleteAction = () => {
    if (game && game.events.length > 0) {
      const updatedEvents = [...game.events];
      updatedEvents.pop();
      setGame({ ...game, events: updatedEvents });
    }
  };

  const handleAnnulGameConfirm = () => {
    setShowExitConfirm(false);
    StorageService.clearActiveGame();
    onAnnulGame();
    navigate('/dashboard');
  };

  const handleFinishGame = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinishGame = async () => {
    setShowFinishConfirm(false);
    
    if (!id || !game || !auth.currentUser) {
      console.error("❌ No se puede finalizar el partido: Faltan datos esenciales (ID, Game o Auth).");
      return;
    }

    try {
      setIsLoading(true); // Feedback visual de guardado

      const payload = {
        ...game,
        authorId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        localTeam: game.teamHome.name,
        visitorTeam: game.teamAway.name,
        stats: isPressMode ? {
          local: {
            gol: game.scoreHome,
            faltas_cometidas: getStat(['FALTA'], game.teamHome.id),
            perdidas: 0,
            recuperos: 0
          },
          visitante: {
            gol: game.scoreAway,
            faltas_cometidas: getStat(['FALTA'], game.teamAway.id),
            perdidas: 0,
            recuperos: 0
          }
        } : {
          scoreHome: game.scoreHome,
          scoreAway: game.scoreAway,
          eventsCount: game.events.length
        },
        isFavorite: game.isFavorite || false
      };

      // 1. Esperamos a que Firebase confirme el guardado exitoso
      await setDoc(doc(db, 'matches', id), payload, { merge: true });
      console.log('✅ Partido guardado en Firebase exitosamente');
      
      // 2. Limpiamos almacenamiento local de sesión activa
      StorageService.clearActiveGame();
      onExitGame(game);
      
      // 3. Forzamos la redirección usando el id limpio de useParams
      console.log(`🚀 Redireccionando a /summary/${id}`);
      navigate(`/summary/${id}`, { replace: true });

    } catch (error) {
      console.error('❌ Error crítico al guardar el partido en Firebase:', error);
      setSnackbar({ message: "Error al guardar en la nube. Inténtalo de nuevo.", visible: true });
      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(base64);
    audio.play();
  };

  // ==========================================
  // JUGADORES/TITULARES Y EVENTOS DE PERIODISTA
  // ==========================================

  const handleShotConfirmed = (
    team: 'local' | 'visitante',
    outcome: 'gol' | 'atajado' | 'desviado',
    playerObj: Player | null,
    atajadoKeepPossession?: boolean
  ) => {
    if (!game) return;
    const isLocal = team === 'local';
    const shootingTeamId = isLocal ? game.teamHome.id : game.teamAway.id;
    const opponentTeamId = isLocal ? game.teamAway.id : game.teamHome.id;
    const opponentPossession = isLocal ? Possession.AWAY : Possession.HOME;
    const teamPossession = isLocal ? Possession.HOME : Possession.AWAY;

    let nextPoss = teamPossession;
    let details = `Disparo al arco: ${outcome.toUpperCase()}`;
    if (playerObj) {
      details += ` | Autor: ${playerObj.name} (#${playerObj.number})`;
    }

    let type = '';
    let scoringTeam: Possession | undefined = undefined;

    if (outcome === 'gol') {
      type = 'DISPARO_GOL';
      scoringTeam = isLocal ? Possession.HOME : Possession.AWAY;
      nextPoss = opponentPossession; // Possession switches after goal
      // Formato enriquecido para gol en modo periodista
      const teamLabel = team; // 'local' o 'visitante'
      const playerStr = playerObj ? ` #${playerObj.number}` : '';
      let originStr = '';
      if (lastSecondaryAction) {
        if (lastSecondaryAction.includes('CÓRNER CORTO') || lastSecondaryAction.includes('CORTO')) originStr = 'De córner corto';
        else if (lastSecondaryAction.includes('PENAL')) originStr = 'De penal';
      }
      details = `Disparo al arco / GOL / jugador ${teamLabel}${playerStr}${originStr ? ` / ${originStr}` : ''}`;
    } else if (outcome === 'desviado') {
      type = 'DISPARO_DESVIADO';
      nextPoss = opponentPossession; // Possession switches after miss
    } else if (outcome === 'atajado') {
      type = 'DISPARO_ATAJADO';
      if (atajadoKeepPossession) {
        nextPoss = teamPossession; // Attacking team keeps ball
        details += ` | Posesión Mantenida`;
      } else {
        nextPoss = opponentPossession; // Defender gets ball
        details += ` | Posesión Perdida`;
      }
    }

    registerEvent(
      type,
      nextPoss,
      50,
      25,
      details,
      shootingTeamId,
      scoringTeam,
      undefined,
      playerObj ? playerObj.name : null,
      type,
      team
    );

    setActiveActionForAssign(null);
  };

  const handleEntry = (team: 'local' | 'visitante', entryType: 'area' | '23y', subAction: string) => {
    if (!game) return;
    const isLocal = team === 'local';
    const teamId = isLocal ? game.teamHome.id : game.teamAway.id;
    const teamPoss = isLocal ? Possession.HOME : Possession.AWAY;

    const type = entryType === 'area' ? 'Ingreso en área' : 'Ingreso en 23';
    const details = `${entryType === 'area' ? 'Ingreso Área' : 'Ingreso 23Y'}: ${subAction}`;

    registerEvent(
      type,
      teamPoss,
      50,
      25,
      details,
      teamId,
      undefined,
      undefined,
      null,
      type,
      team
    );
  };

  const handleConfirmFoul = () => {
    if (!activeFoul || !game) return;
    const { team, type, subAction } = activeFoul;
    const isLocal = team === 'local';

    const committingTeam: 'local' | 'visitante' = (type === 'committed') ? team : (isLocal ? 'visitante' : 'local');
    const victimTeam: 'local' | 'visitante' = (type === 'committed') ? (isLocal ? 'visitante' : 'local') : team;

    const committingTeamId = committingTeam === 'local' ? game.teamHome.id : game.teamAway.id;
    const victimTeamId = victimTeam === 'local' ? game.teamHome.id : game.teamAway.id;

    const commPlayers = committingTeam === 'local' ? game.teamHome.players : game.teamAway.players;
    const playerObj = commPlayers.find(p => p.id === selectedFoulPlayer);
    const playerName = playerObj ? `${playerObj.name} (#${playerObj.number})` : null;

    const foulType = type === 'committed' ? 'FALTA COMETIDA' : 'FALTA RECIBIDA';
    let foulDetails = `Falta ${type === 'committed' ? 'Cometida' : 'Recibida'}: ${subAction}`;
    if (playerName) {
      foulDetails += ` | Autor: ${playerName}`;
    }

    const activeTeamPoss = team === 'local' ? Possession.HOME : Possession.AWAY;
    const opponentPoss = team === 'local' ? Possession.AWAY : Possession.HOME;
    const nextPoss = (type === 'committed') ? opponentPoss : activeTeamPoss;

    registerEvent(
      foulType,
      nextPoss,
      50,
      50,
      foulDetails,
      committingTeamId,
      undefined,
      undefined,
      playerName,
      foulType,
      committingTeam
    );

    if (selectedFoulCard) {
      const cardType = selectedFoulCard === 'verde' ? 'TARJETA VERDE' : selectedFoulCard === 'amarilla' ? 'TARJETA AMARILLA' : 'TARJETA ROJA';
      let cardDetails = `Tarjeta ${selectedFoulCard.toUpperCase()}`;
      if (playerName) {
        cardDetails += ` | Sancionado: ${playerName}`;
      }
      registerEvent(
        cardType,
        nextPoss,
        50,
        50,
        cardDetails,
        committingTeamId,
        undefined,
        undefined,
        playerName,
        cardType,
        committingTeam
      );
    }

    if (selectedFoulFija) {
      const fijaType = selectedFoulFija === 'corner_corto' ? 'CÓRNER CORTO' : 'PENAL';
      const fijaDetails = `${selectedFoulFija === 'corner_corto' ? 'Córner Corto' : 'Penal'} otorgado`;
      registerEvent(
        fijaType,
        nextPoss,
        50,
        25,
        fijaDetails,
        victimTeamId,
        undefined,
        undefined,
        null,
        fijaType,
        victimTeam
      );
    }

    setActiveFoul(null);
    setSelectedFoulPlayer(null);
    setSelectedFoulCard(null);
    setSelectedFoulFija(null);
  };

  const handleCancelFoul = () => {
    setActiveFoul(null);
    setSelectedFoulPlayer(null);
    setSelectedFoulCard(null);
    setSelectedFoulFija(null);
  };

  // ==========================================
  // COMPONENTES DE COMPARACIÓN Y RENDERS PÁGINAS
  // ==========================================

  const PressComparisonBar: React.FC<{
    homeValue: number;
    awayValue: number;
    homeColor: string;
    awayColor: string;
  }> = ({ homeValue, awayValue, homeColor, awayColor }) => {
    const total = homeValue + awayValue;
    const homePctBar = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPctBar = total > 0 ? (awayValue / total) * 100 : 50;

    return (
      <div className="w-full flex flex-col gap-1 mt-1">
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
          <div className="h-full transition-all duration-500" style={{ width: `${homePctBar}%`, backgroundColor: homeColor }}></div>
          <div className="h-full transition-all duration-500" style={{ width: `${awayPctBar}%`, backgroundColor: awayColor }}></div>
        </div>
        <div className="flex justify-between items-center text-[9px] font-bold text-white/40 px-1">
          <span>{homeValue}</span>
          <span>{awayValue}</span>
        </div>
      </div>
    );
  };

  const PressStatCard: React.FC<{
    title: string;
    homeValue: number;
    awayValue: number;
    homeColor: string;
    awayColor: string;
    icon?: React.ReactNode;
  }> = ({ title, homeValue, awayValue, homeColor, awayColor, icon }) => {
    return (
      <div className="bg-[#1e293b]/35 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-lato text-xs font-black text-white uppercase tracking-wider">{title}</span>
          </div>
          <span className="font-contrail text-sm font-black text-white">{homeValue} / {awayValue}</span>
        </div>
        <PressComparisonBar homeValue={homeValue} awayValue={awayValue} homeColor={homeColor} awayColor={awayColor} />
      </div>
    );
  };

  const renderPressStatsContent = (isModal = false) => {
    if (!game) return null;
    const homeColor = game.teamHome.primaryColor || '#6d5dfc';
    const awayColor = game.teamAway.primaryColor || '#ef4444';

    const homeShots = getStat(['DISPARO'], game.teamHome.id);
    const awayShots = getStat(['DISPARO'], game.teamAway.id);

    const homeCC = getStat(['CÓRNER CORTO', 'CORTO'], game.teamHome.id);
    const awayCC = getStat(['CÓRNER CORTO', 'CORTO'], game.teamAway.id);

    const homePenal = getStat(['PENAL'], game.teamHome.id);
    const awayPenal = getStat(['PENAL'], game.teamAway.id);

    const homeArea = getStat(['Ingreso en área', 'Ingreso Rival en área'], game.teamHome.id);
    const awayArea = getStat(['Ingreso en área', 'Ingreso Rival en área'], game.teamAway.id);

    const home23 = getStat(['Ingreso en 23', 'Ingreso rival en 23'], game.teamHome.id);
    const away23 = getStat(['Ingreso en 23', 'Ingreso rival en 23'], game.teamAway.id);

    const homeFouls = getStat(['FALTA'], game.teamHome.id);
    const awayFouls = getStat(['FALTA'], game.teamAway.id);

    const homeVerde = getStat(['TARJETA VERDE', 'VERDE'], game.teamHome.id);
    const awayVerde = getStat(['TARJETA VERDE', 'VERDE'], game.teamAway.id);

    const homeAmarilla = getStat(['TARJETA AMARILLA', 'AMARILLA'], game.teamHome.id);
    const awayAmarilla = getStat(['TARJETA AMARILLA', 'AMARILLA'], game.teamAway.id);

    const homeRoja = getStat(['TARJETA ROJA', 'ROJA'], game.teamHome.id);
    const awayRoja = getStat(['TARJETA ROJA', 'ROJA'], game.teamAway.id);

    const totalPoss = localPossessionTime + awayPossessionTime;
    const lPct = totalPoss > 0 ? Math.round((localPossessionTime / totalPoss) * 100) : 50;
    const aPct = 100 - lPct;

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isModal ? 'pb-6' : ''}`}>
        <div className="flex flex-col gap-3">
          <h4 className="contrail-font text-[10px] font-black text-white/50 uppercase tracking-widest border-b border-white/5 pb-1">Ataque y Progresión</h4>
          <PressStatCard
            title="Disparos"
            homeValue={homeShots}
            awayValue={awayShots}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-crosshairs text-white text-[10px]"></i>}
          />
          <PressStatCard
            title="Córner Corto"
            homeValue={homeCC}
            awayValue={awayCC}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-flag text-white text-[10px]"></i>}
          />
          <PressStatCard
            title="Penales"
            homeValue={homePenal}
            awayValue={awayPenal}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-bullseye text-white text-[10px]"></i>}
          />
          <PressStatCard
            title="Ingreso Área"
            homeValue={homeArea}
            awayValue={awayArea}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-arrow-right-to-bracket text-white text-[10px]"></i>}
          />
          <PressStatCard
            title="Ingreso 23Y"
            homeValue={home23}
            awayValue={away23}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-bezier-curve text-white text-[10px]"></i>}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="contrail-font text-[10px] font-black text-white/50 uppercase tracking-widest border-b border-white/5 pb-1">Control e Infracciones</h4>

          <div className="bg-[#1e293b]/35 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-stopwatch text-white text-[10px]"></i>
                <span className="font-lato text-xs font-black text-white uppercase tracking-wider">Posesión</span>
              </div>
              <span className="font-contrail text-sm font-black text-white">{lPct}% / {aPct}%</span>
            </div>
            <div className="w-full flex flex-col gap-1 mt-1">
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                <div className="h-full transition-all duration-500" style={{ width: `${lPct}%`, backgroundColor: homeColor }}></div>
                <div className="h-full transition-all duration-500" style={{ width: `${aPct}%`, backgroundColor: awayColor }}></div>
              </div>
            </div>
          </div>

          <PressStatCard
            title="Faltas"
            homeValue={homeFouls}
            awayValue={awayFouls}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<i className="fa-solid fa-triangle-exclamation text-white text-[10px]"></i>}
          />
          <PressStatCard
            title="Tarjeta Verde"
            homeValue={homeVerde}
            awayValue={awayVerde}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<span className="w-2 h-3 bg-green-500 rounded-[2px] block"></span>}
          />
          <PressStatCard
            title="Tarjeta Amarilla"
            homeValue={homeAmarilla}
            awayValue={awayAmarilla}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<span className="w-2 h-3 bg-yellow-500 rounded-[2px] block"></span>}
          />
          <PressStatCard
            title="Tarjeta Roja"
            homeValue={homeRoja}
            awayValue={awayRoja}
            homeColor={homeColor}
            awayColor={awayColor}
            icon={<span className="w-2 h-3 bg-red-500 rounded-[2px] block"></span>}
          />
        </div>
      </div>
    );
  };

  const renderPressSidebar = () => {
    return (
      <div className="flex flex-col gap-4 pb-10">
        <h3 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 italic">Reporte de Transmisión</h3>
        {renderPressStatsContent(false)}
      </div>
    );
  };

  const renderPressSidebarLeft = () => {
    if (!game) return null;
    const homeColor = game.teamHome.primaryColor || '#6d5dfc';
    const awayColor = game.teamAway.primaryColor || '#ef4444';
    const homeShots = getStat(['DISPARO'], game.teamHome.id);
    const awayShots = getStat(['DISPARO'], game.teamAway.id);
    const homeCC = getStat(['CÓRNER CORTO', 'CORTO'], game.teamHome.id);
    const awayCC = getStat(['CÓRNER CORTO', 'CORTO'], game.teamAway.id);
    const homePenal = getStat(['PENAL'], game.teamHome.id);
    const awayPenal = getStat(['PENAL'], game.teamAway.id);
    const homeArea = getStat(['Ingreso en área', 'Ingreso Rival en área'], game.teamHome.id);
    const awayArea = getStat(['Ingreso en área', 'Ingreso Rival en área'], game.teamAway.id);
    const home23 = getStat(['Ingreso en 23', 'Ingreso rival en 23'], game.teamHome.id);
    const away23 = getStat(['Ingreso en 23', 'Ingreso rival en 23'], game.teamAway.id);
    return (
      <div className="flex flex-col gap-4 pb-10">
        <h3 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 italic">Ataque y Progresión</h3>
        <div className="flex flex-col gap-3">
          <PressStatCard title="Disparos" homeValue={homeShots} awayValue={awayShots} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-crosshairs text-white text-[10px]"></i>} />
          <PressStatCard title="Córner Corto" homeValue={homeCC} awayValue={awayCC} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-flag text-white text-[10px]"></i>} />
          <PressStatCard title="Penales" homeValue={homePenal} awayValue={awayPenal} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-bullseye text-white text-[10px]"></i>} />
          <PressStatCard title="Ingreso Área" homeValue={homeArea} awayValue={awayArea} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-arrow-right-to-bracket text-white text-[10px]"></i>} />
          <PressStatCard title="Ingreso 23Y" homeValue={home23} awayValue={away23} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-bezier-curve text-white text-[10px]"></i>} />
        </div>
      </div>
    );
  };

  const renderPressSidebarRight = () => {
    if (!game) return null;
    const homeColor = game.teamHome.primaryColor || '#6d5dfc';
    const awayColor = game.teamAway.primaryColor || '#ef4444';
    const homeFouls = getStat(['FALTA'], game.teamHome.id);
    const awayFouls = getStat(['FALTA'], game.teamAway.id);
    const homeVerde = getStat(['TARJETA VERDE', 'VERDE'], game.teamHome.id);
    const awayVerde = getStat(['TARJETA VERDE', 'VERDE'], game.teamAway.id);
    const homeAmarilla = getStat(['TARJETA AMARILLA', 'AMARILLA'], game.teamHome.id);
    const awayAmarilla = getStat(['TARJETA AMARILLA', 'AMARILLA'], game.teamAway.id);
    const homeRoja = getStat(['TARJETA ROJA', 'ROJA'], game.teamHome.id);
    const awayRoja = getStat(['TARJETA ROJA', 'ROJA'], game.teamAway.id);
    const totalPoss = localPossessionTime + awayPossessionTime;
    const lPct = totalPoss > 0 ? Math.round((localPossessionTime / totalPoss) * 100) : 50;
    const aPct = 100 - lPct;
    return (
      <div className="flex flex-col gap-4 pb-10">
        <h3 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 italic">Control e Infracciones</h3>
        <div className="flex flex-col gap-3">
          <div className="bg-[#1e293b]/35 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-stopwatch text-white text-[10px]"></i>
                <span className="font-lato text-xs font-black text-white uppercase tracking-wider">Posesión</span>
              </div>
              <span className="font-contrail text-sm font-black text-white">{lPct}% / {aPct}%</span>
            </div>
            <div className="w-full flex flex-col gap-1 mt-1">
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                <div className="h-full transition-all duration-500" style={{ width: `${lPct}%`, backgroundColor: homeColor }}></div>
                <div className="h-full transition-all duration-500" style={{ width: `${aPct}%`, backgroundColor: awayColor }}></div>
              </div>
            </div>
          </div>
          <PressStatCard title="Faltas" homeValue={homeFouls} awayValue={awayFouls} homeColor={homeColor} awayColor={awayColor} icon={<i className="fa-solid fa-triangle-exclamation text-white text-[10px]"></i>} />
          <PressStatCard title="Tarjeta Verde" homeValue={homeVerde} awayValue={awayVerde} homeColor={homeColor} awayColor={awayColor} icon={<span className="w-2 h-3 bg-green-500 rounded-[2px] block"></span>} />
          <PressStatCard title="Tarjeta Amarilla" homeValue={homeAmarilla} awayValue={awayAmarilla} homeColor={homeColor} awayColor={awayColor} icon={<span className="w-2 h-3 bg-yellow-500 rounded-[2px] block"></span>} />
          <PressStatCard title="Tarjeta Roja" homeValue={homeRoja} awayValue={awayRoja} homeColor={homeColor} awayColor={awayColor} icon={<span className="w-2 h-3 bg-red-500 rounded-[2px] block"></span>} />
        </div>
      </div>
    );
  };

  const renderStartersModal = () => {
    if (!showStartersModal || !game) return null;
    const team = showStartersModal;
    const isLocal = team === 'local';
    const teamName = isLocal ? game.teamHome.name : game.teamAway.name;
    const players = isLocal ? game.teamHome.players : game.teamAway.players;
    const currentStarters = isLocal
      ? (game.metadata?.localStarters || [])
      : (game.metadata?.visitanteStarters || []);

    const toggleStarter = (playerId: string) => {
      setGame(prev => {
        if (!prev) return null;
        const meta = prev.metadata || {
          torneo: '',
          jornada: '',
          rama: '',
          categoria: '',
          estadio: '',
          hora: '',
          arbitros: '',
          localPlayers: prev.teamHome.players,
          visitantePlayers: prev.teamAway.players,
          localStarters: [],
          visitanteStarters: []
        };
        const starters = isLocal ? (meta.localStarters || []) : (meta.visitanteStarters || []);
        const newStarters = starters.includes(playerId)
          ? starters.filter(id => id !== playerId)
          : [...starters, playerId];

        return {
          ...prev,
          metadata: {
            ...meta,
            localStarters: isLocal ? newStarters : (meta.localStarters || []),
            visitanteStarters: !isLocal ? newStarters : (meta.visitanteStarters || [])
          }
        };
      });
    };

    return (
      <Portal>
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="w-full max-w-lg bg-[#131041]/90 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="contrail-font text-lg font-black text-white uppercase tracking-widest">Titulares: {teamName}</h3>
                <p className="text-[10px] text-white/50 uppercase font-bold mt-1">Selecciona los 11 jugadores iniciales</p>
              </div>
              <button
                onClick={() => setShowStartersModal(null)}
                className="text-white/60 hover:text-white text-xl font-bold bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar py-2 grid grid-cols-2 gap-2.5">
              {players.map(p => {
                const isSelected = currentStarters.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleStarter(p.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all text-left ${isSelected
                      ? 'bg-[#00fe00]/10 border-[#00fe00]/40 text-[#00fe00] shadow-[0_0_10px_rgba(0,254,0,0.1)]'
                      : 'bg-white/5 border-white/5 text-white hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isSelected ? 'bg-[#00fe00] text-black' : 'bg-white/10 text-white/60'}`}>
                        {p.number}
                      </span>
                      <span className="font-bold text-xs truncate uppercase font-lato">{p.name}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#00fe00] bg-[#00fe00]/20' : 'border-white/30'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#00fe00]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-white/60 uppercase">Seleccionados: {currentStarters.length} / 11</span>
              <button
                onClick={() => setShowStartersModal(null)}
                className="bg-[#00fe00] text-black px-6 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#02e002] transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  const renderFoulOutcomeModal = () => {
    if (!activeFoul || !game) return null;
    const { team, type, subAction } = activeFoul;
    const isLocal = team === 'local';

    const committingTeam = type === 'committed' ? team : (isLocal ? 'visitante' : 'local');
    const committingTeamName = committingTeam === 'local' ? game.teamHome.name : game.teamAway.name;
    const players = committingTeam === 'local' ? game.teamHome.players : game.teamAway.players;

    return (
      <Portal>
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="w-full max-w-xl bg-[#131041]/90 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3 shrink-0">
              <div>
                <span className="text-[9px] font-black text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 block w-max animate-pulse">
                  Infracción: {subAction.toUpperCase()}
                </span>
                <h3 className="contrail-font text-lg font-black text-white uppercase tracking-wider">
                  Consecuencias de la Falta
                </h3>
              </div>
              <button
                onClick={handleCancelFoul}
                className="text-white/60 hover:text-white text-xl font-bold bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  Sanción Disciplinaria (Tarjeta)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { const nc = selectedFoulCard === 'verde' ? null : 'verde'; setSelectedFoulCard(nc); if (!nc) setSelectedFoulPlayer(null); }}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-xs font-bold ${selectedFoulCard === 'verde'
                      ? 'bg-green-500/20 border-green-500 text-green-400 font-black shadow-md'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                  >
                    <span className="w-2.5 h-4 bg-green-500 rounded-[2px] block"></span>
                    <span>Verde</span>
                  </button>
                  <button
                    onClick={() => { const nc = selectedFoulCard === 'amarilla' ? null : 'amarilla'; setSelectedFoulCard(nc); if (!nc) setSelectedFoulPlayer(null); }}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-xs font-bold ${selectedFoulCard === 'amarilla'
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-black shadow-md'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                  >
                    <span className="w-2.5 h-4 bg-yellow-500 rounded-[2px] block"></span>
                    <span>Amarilla</span>
                  </button>
                  <button
                    onClick={() => { const nc = selectedFoulCard === 'roja' ? null : 'roja'; setSelectedFoulCard(nc); if (!nc) setSelectedFoulPlayer(null); }}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-xs font-bold ${selectedFoulCard === 'roja'
                      ? 'bg-red-500/20 border-red-500 text-red-400 font-black shadow-md'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                  >
                    <span className="w-2.5 h-4 bg-red-500 rounded-[2px] block"></span>
                    <span>Roja</span>
                  </button>
                </div>
              </div>

              {selectedFoulCard && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-top duration-300">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex justify-between">
                  <span>Asignar Jugador Infractor ({committingTeamName})</span>
                  {selectedFoulPlayer && (
                    <button
                      onClick={() => setSelectedFoulPlayer(null)}
                      className="text-primary hover:underline font-bold"
                    >
                      Limpiar
                    </button>
                  )}
                </label>
                <div className="max-h-48 overflow-y-auto border border-white/5 rounded-2xl bg-black/20 p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 no-scrollbar">
                  {players.map(p => {
                    const isSelected = selectedFoulPlayer === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedFoulPlayer(isSelected ? null : p.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left truncate ${isSelected
                          ? 'bg-primary/20 border-primary text-white shadow-md'
                          : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                          }`}
                      >
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                          {p.number}
                        </span>
                        <span className="font-bold text-[11px] truncate uppercase font-lato">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  Jugada Fija a Favor (Ventaja)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedFoulFija(selectedFoulFija === 'corner_corto' ? null : 'corner_corto')}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-xs font-bold ${selectedFoulFija === 'corner_corto'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-black shadow-md'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                  >
                    <i className="fa-solid fa-flag text-xs"></i>
                    <span>Córner Corto</span>
                  </button>
                  <button
                    onClick={() => setSelectedFoulFija(selectedFoulFija === 'penal' ? null : 'penal')}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-xs font-bold ${selectedFoulFija === 'penal'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-black shadow-md'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                  >
                    <i className="fa-solid fa-bullseye text-xs"></i>
                    <span>Penal</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-3 shrink-0">
              <button
                onClick={handleCancelFoul}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors border border-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFoul}
                className="flex-[1.5] bg-[#00fe00] hover:bg-[#02e002] text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-colors font-contrail shadow-[0_0_15px_rgba(0,254,0,0.2)]"
              >
                {selectedFoulCard || selectedFoulFija || selectedFoulPlayer ? 'Confirmar Consecuencias' : 'Continuar sin consecuencias'}
              </button>
            </div>

          </div>
        </div>
      </Portal>
    );
  };

  const renderAssignPlayerPopover = () => {
    if (!activeActionForAssign || !game) return null;
    const { team, cardId, subActionId } = activeActionForAssign;
    const isLocal = team === 'local';
    const teamName = isLocal ? game.teamHome.name : game.teamAway.name;
    const players = isLocal ? game.teamHome.players : game.teamAway.players;

    if (subActionId === 'atajado_poss') {
      const selectedPlayer = (activeActionForAssign as any).metadata as Player | null;
      return (
        <Portal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <div className="w-full max-w-sm bg-[#131041]/95 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col">
              <div className="mb-4 text-center">
                <h3 className="contrail-font text-lg font-black text-white uppercase tracking-wider">
                  Resultado de Rebote
                </h3>
                <p className="text-[10px] text-white/50 uppercase font-bold mt-1">¿Qué sucede con la posesión?</p>
              </div>

              <div className="flex flex-col gap-3 my-4">
                <button
                  onClick={() => handleShotConfirmed(team, 'atajado', selectedPlayer, true)}
                  className="py-4 px-6 rounded-2xl border border-white/10 bg-white/5 text-white font-bold text-xs uppercase tracking-wider hover:border-[#00fe00] hover:bg-[#00fe00]/5 transition-all text-center flex flex-col items-center justify-center gap-1"
                >
                  <span className="font-black text-[#00fe00]">Mantiene Posesión</span>
                  <span className="text-[9px] text-white/40 normal-case font-medium">El equipo atacante retiene la bocha</span>
                </button>
                <button
                  onClick={() => handleShotConfirmed(team, 'atajado', selectedPlayer, false)}
                  className="py-4 px-6 rounded-2xl border border-white/10 bg-white/5 text-white font-bold text-xs uppercase tracking-wider hover:border-[#ef4444] hover:bg-[#ef4444]/5 transition-all text-center flex flex-col items-center justify-center gap-1"
                >
                  <span className="font-black text-[#ef4444]">Pierde Posesión</span>
                  <span className="text-[9px] text-white/40 normal-case font-medium">La posesión cambia de manos</span>
                </button>
              </div>

              <button
                onClick={() => setActiveActionForAssign(null)}
                className="mt-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors border border-white/5 text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Portal>
      );
    }

    return (
      <Portal>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="w-full max-w-md bg-[#131041]/95 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="contrail-font text-lg font-black text-white uppercase tracking-wider">
                  Asignar Autor: {subActionId.toUpperCase()}
                </h3>
                <p className="text-[10px] text-white/50 uppercase font-bold mt-1">Selecciona el jugador que remató ({teamName})</p>
              </div>
              <button
                onClick={() => setActiveActionForAssign(null)}
                className="text-white/60 hover:text-white text-xl font-bold bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar py-2 grid grid-cols-2 gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (subActionId === 'atajado') {
                      setActiveActionForAssign({ team, cardId, subActionId: 'atajado_poss', metadata: p });
                    } else {
                      handleShotConfirmed(team, subActionId as any, p);
                    }
                  }}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-white hover:border-white/20 transition-all flex items-center gap-2 truncate text-left"
                >
                  <span className="w-5 h-5 rounded-lg bg-white/10 text-white/60 flex items-center justify-center text-[9px] font-black shrink-0">
                    {p.number}
                  </span>
                  <span className="font-bold text-[11px] truncate uppercase font-lato">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex gap-2 shrink-0">
              <button
                onClick={() => {
                  if (subActionId === 'atajado') {
                    setActiveActionForAssign({ team, cardId, subActionId: 'atajado_poss', metadata: null });
                  } else {
                    handleShotConfirmed(team, subActionId as any, null);
                  }
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors border border-white/5"
              >
                Omitir Jugador
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  // ==========================================
  // JUGADORES/TITULARES Y EVENTOS DE PERIODISTA
  // ==========================================

  /**
   * Controlador único y genérico para procesar las acciones del JSON dinámico
   */
  const handlePressDynamicAction = (boton: any, team: 'local' | 'visitante') => {
    if (!game) return;
    if (!isRunning) {
      setSnackbar({ message: "Inicia el cronómetro para registrar acciones", visible: true });
      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2500);
      return;
    }

    const isLocal = team === 'local';
    const teamId = isLocal ? game.teamHome.id : game.teamAway.id;
    const teamPossession = isLocal ? Possession.HOME : Possession.AWAY;

    const lx = 50;
    const ly = 25;

    switch (boton.flujo_consecuencia) {
      case "abrir_modal_jugador_ataque":
        setActiveActionForAssign({
          team,
          cardId: 'disparo_arco',
          subActionId: boton.id.replace('remate_', '') as any
        });
        break;

      case "registro_directo_sin_modal":
        registerEvent(
          boton.kpi_principal, // Registra el string 'Ingreso en área'
          teamPossession,
          lx,
          ly,
          `${boton.nombre}: Registro limpio`,
          teamId,
          undefined,
          undefined,
          null,
          boton.kpi_principal,
          team
        );
        break;

      case "abrir_modal_infraccion_con_cambio_posesion":
        setActiveFoul({
          team,
          type: 'committed',
          subAction: boton.nombre
        });
        break;

      case "abrir_modal_infraccion_mantiene_posesion":
        setActiveFoul({
          team,
          type: 'received',
          subAction: boton.nombre
        });
        break;

      default:
        console.warn(`Flujo de consecuencia no reconocido: ${boton.flujo_consecuencia}`);
        break;
    }
  };

  /**
   * Renderizador Dinámico de Bloques de Equipo Basado en el JSON de Firestore
   */
  const renderPressTeamBlock = (team: 'local' | 'visitante') => {
    if (!game || !dbAcciones || Object.keys(dbAcciones).length === 0) return null;

    const isLocal = team === 'local';
    const teamObj = isLocal ? game.teamHome : game.teamAway;
    const teamColor = teamObj.primaryColor || (isLocal ? '#6d5dfc' : '#ef4444');
    const isCurrentPossession = (isLocal && possession === Possession.HOME) || (!isLocal && possession === Possession.AWAY);

    if (!isCurrentPossession) {
      return (
        <div
          className="flex-none h-14 md:h-16 flex items-center p-4 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-sm cursor-pointer opacity-55 hover:opacity-85"
          onClick={() => {
            setPossession(isLocal ? Possession.HOME : Possession.AWAY);
            if (navigator.vibrate) navigator.vibrate(50);
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }}></div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{teamObj.name}</span>
            <div className="flex-1"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPossession(isLocal ? Possession.HOME : Possession.AWAY);
                if (navigator.vibrate) navigator.vibrate(50);
              }}
              className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00fe00] text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-shield-halved text-[#00fe00] text-[10px] animate-pulse"></i>
              <span>Recuperar Posesión</span>
            </button>
          </div>
        </div>
      );
    }

    // Extraemos las categorías de acciones cargadas desde el documento raíz
    const accionesPeriodista = (dbAcciones as any).modos?.periodista?.bloque_acciones || [];

    return (
      <div
        className="flex-1 flex flex-col p-3 sm:p-4 rounded-3xl border border-white/10 shadow-2xl gap-3 min-h-0 overflow-hidden"
        style={{
          backgroundColor: `${teamColor}08`,
          borderColor: `${teamColor}30`,
        }}
      >
        <div className="flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }}></div>
            <span className="font-black text-sm text-white uppercase tracking-wider font-contrail">
              {teamObj.name}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStartersModal(team)}
              className="text-[9px] font-black text-[#00fe00] bg-[#00fe00]/10 border border-[#00fe00]/20 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-[#00fe00]/20 transition-all flex items-center gap-1"
            >
              <i className="fa-solid fa-users text-[8px]"></i> Titulares
            </button>
            <span className="text-[9px] font-black bg-[#00fe00]/10 text-[#00fe00] border border-[#00fe00]/20 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(0,254,0,0.1)]">
              ● En posesión
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch min-h-0 w-full">
          {accionesPeriodista.map((bloque: any) => (
            <div key={bloque.categoria} className="flex-1 flex flex-col gap-2 min-h-0">
              <h4 className="font-bold text-[9px] uppercase tracking-widest text-white/40 border-b border-white/5 pb-0.5">
                {bloque.categoria}
              </h4>

              <div className="flex-1 flex flex-col gap-2 justify-center">
                {bloque.cards.map((card: any) => {
                  const isGolCard = card.id === 'disparo_al_arco';
                  const isFaltaCometida = card.id === 'faltas_cometidas';

                  return (
                    <div
                      key={card.id}
                      className="flex-1 border border-white/5 rounded-xl bg-black/20 p-2 flex flex-col gap-1 min-h-0 justify-center"
                    >
                      <span className="font-bold text-[9px] uppercase tracking-widest text-white/55 shrink-0 flex justify-between">
                        <span>{card.titulo}</span>
                        {card.subtitulo && (
                          <span className={`text-[7px] font-black uppercase ${isFaltaCometida ? 'text-[#ef4444]' : 'text-[#00fe00]'}`}>
                            {card.subtitulo}
                          </span>
                        )}
                      </span>

                      <div className="flex-1 flex gap-2 w-full items-center">
                        {card.botones.map((btn: any) => {
                          let btnStyleClass = "bg-white/5 hover:bg-white/10 border-white/10 text-white";
                          if (isGolCard) {
                            if (btn.id.includes('gol')) btnStyleClass = "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400";
                            else if (btn.id.includes('atajado')) btnStyleClass = "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400";
                            else btnStyleClass = "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400";
                          } else if (isFaltaCometida) {
                            btnStyleClass = "bg-[#ef4444]/5 hover:bg-[#ef4444]/15 border-[#ef4444]/10 text-white/90";
                          } else if (card.id === 'faltas_recibidas') {
                            btnStyleClass = "bg-[#00fe00]/5 hover:bg-[#00fe00]/15 border-[#00fe00]/10 text-white/90";
                          }

                          return (
                            <button
                              key={btn.id}
                              onClick={() => handlePressDynamicAction(btn, team)}
                              className={`flex-1 rounded-lg border font-black text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 min-h-[40px] px-2 ${btnStyleClass}`}
                              title={btn.nombre}
                            >
                              <span className="truncate">{btn.nombre}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPressLayout = () => {
    return (
      <div className="w-full h-full p-2 sm:p-4 flex flex-col items-stretch min-h-0 min-w-0">
        <div className="w-full h-full bg-[#131041]/40 backdrop-blur-[16px] border border-white/10 rounded-[32px] p-3 sm:p-4 flex flex-col gap-2 shadow-2xl relative min-h-0 min-w-0 overflow-hidden">
          <div className="flex-grow flex flex-col gap-2 items-stretch min-h-0 w-full">
            {renderPressTeamBlock('local')}
            {renderPressTeamBlock('visitante')}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || (!game && !showResumePrompt)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0a21] text-white gap-4">
        {loadError ? (
          <div className="text-red-400 text-center px-6">
            <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <p className="font-bold text-sm uppercase">{loadError}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-3 bg-[#1e293b]/45 backdrop-blur-md border border-white/10/10 rounded-full font-black text-xs uppercase hover:bg-[#1e293b]/45 backdrop-blur-md border border-white/10/20 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="contrail-font font-black text-xs uppercase tracking-widest text-white/50 animate-pulse">Cargando partido...</p>
          </>
        )}
      </div>
    );
  }

  // Si showResumePrompt es true y game es null, renderizamos solo el modal usando un div vacío como base
  if (!game && showResumePrompt) {
    return (
      <div className="min-h-screen bg-[#0c0a21]">
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200 text-center">
              <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-hourglass-half"></i></div>
              <h3 className="contrail-font contrail-font text-2xl text-white uppercase mb-2">Partido en Curso</h3>
              <p className="text-[11px] font-bold text-white uppercase leading-relaxed mb-8">
                Tienes un partido sin finalizar guardado localmente. ¿Deseas continuar el partido anterior o empezar uno nuevo?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (pendingActiveGame) {
                      setGame(pendingActiveGame.game);
                      setSeconds(pendingActiveGame.seconds);
                      setPeriod(pendingActiveGame.period);
                      setPossession(pendingActiveGame.possession);
                      setLocalPossessionTime(pendingActiveGame.localPossessionTime);
                      setAwayPossessionTime(pendingActiveGame.awayPossessionTime);
                      setPassCount(pendingActiveGame.passCount);
                      setIsRunning(pendingActiveGame.isRunning);
                      if (pendingActiveGame.game.activeTacticId) setActiveTacticId(pendingActiveGame.game.activeTacticId);
                    }
                    setShowResumePrompt(false);
                  }}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase shadow-lg shadow-primary/20 transition-all"
                >
                  CONTINUAR PARTIDO
                </button>
                <button
                  onClick={() => {
                    StorageService.clearActiveGame();
                    onAnnulGame();
                    navigate('/new-game');
                  }}
                  className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl active:scale-95 text-xs uppercase border border-red-200 transition-all hover:bg-red-100"
                >
                  EMPEZAR UNO NUEVO
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </div>
    );
  }

  const hasPasses = game.passChains.length > 0;
  const pAvg = hasPasses ? (game.passChains.reduce((a, b) => a + b, 0) / game.passChains.length).toFixed(1) : 0;
  const pMax = hasPasses ? Math.max(...game.passChains) : 0;
  const pMin = hasPasses ? Math.min(...game.passChains) : 0;

  const getEventForPassCount = (count: number) => {
    return game.events.find(e => e.details?.includes(`(${count} pases)`));
  };

  const minPassEvent = pMin > 0 ? getEventForPassCount(pMin) : null;
  const maxPassEvent = pMax > 0 ? getEventForPassCount(pMax) : null;

  const totalPossessionTime = localPossessionTime + awayPossessionTime;
  const localPct = totalPossessionTime > 0 ? Math.round((localPossessionTime / totalPossessionTime) * 100) : 50;
  const awayPct = 100 - localPct;

  const filteredEvents = game.events.filter(e => {
    const actionMatch = eventFilter === 'ALL' || e.type.includes(eventFilter);
    const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
    return actionMatch && periodMatch;
  }).slice().reverse();

  const FilterChips = () => (
    <div className="flex flex-col gap-3 mb-4 shrink-0">
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'ALL', label: 'Todo', icon: (<i className="fa-clipboard-list fa-solid text-white"></i>) },
          { id: 'DISPARO', label: 'Remate', icon: (<i className="fa-futbol fa-solid text-white"></i>) },
          { id: 'FALTA', label: 'Falta', icon: '⚠️' },
          { id: 'PÉRDIDA', label: 'Pérdida', icon: (<i className="fa-arrow-trend-down fa-solid text-white"></i>) },
          { id: 'RECUPERO', label: 'Recupero', icon: (<i className="fa-arrow-trend-up fa-solid text-white"></i>) },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setEventFilter(f.id as ActionFilter)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${eventFilter === f.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/60 border-white/10 hover:border-primary/40'
              }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[{ id: 'ALL', label: 'Todos Q' }, { id: 1, label: '1Q' }, { id: 2, label: '2Q' }, { id: 3, label: '3Q' }, { id: 4, label: '4Q' }].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodFilter(p.id as PeriodFilter)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${periodFilter === p.id
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/60 border-white/10 hover:border-primary/40'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );



  const getTeamsStat = (types: string[]) => {
    const home = game.events.filter(e => {
      const isTeam = e.teamId === game.teamHome.id;
      const isTarget = types.some(t => e.type.toUpperCase().includes(t.toUpperCase()));
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return isTeam && isTarget && periodMatch;
    }).length;
    const away = game.events.filter(e => {
      const isTeam = e.teamId === game.teamAway.id;
      const isTarget = types.some(t => e.type.toUpperCase().includes(t.toUpperCase()));
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return isTeam && isTarget && periodMatch;
    }).length;
    return { home, away };
  };

  const landscapeShots = getTeamsStat(['DISPARO']);
  const landscapeFouls = getTeamsStat(['FALTA']);
  const turnoversHome = getStat(['PÉRDIDA']);
  const stealsHome = getStat(['RECUPERO']);
  const isIn23Zone = (y: number) => y < 23 || y > 77;

  return (
    <div
      className="bg-[#020617] select-none transition-all duration-500 fixed inset-0 z-50 w-full bg-cover bg-center"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', overscrollBehavior: 'none', backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(./assets/dashboard-bg.jpg)' }}
    >

      {snackbar.visible && (
        <Portal>
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-brandDark text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-300 border border-primary/20 flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest">{snackbar.message}</span>
          </div>
        </Portal>
      )}

      {/* Modal Detalles de Gol eliminado y unificado con Modal de Remate */}

      {/* Modal de Confirmación de Período */}
      {periodToConfirm !== null && (
        <Portal>
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl mb-6"><i className="fa-solid fa-stopwatch"></i></div>
              <h3 className="contrail-font text-[10px] font-black text-white uppercase tracking-[4px] mb-2">Finalizar Tiempo Actual</h3>
              <h2 className="contrail-font text-2xl text-white uppercase tracking-tighter leading-tight mb-6">
                ¿Deseas finalizar el período actual y comenzar el {periodToConfirm}Q?
              </h2>
              <p className="text-[11px] text-white/60 font-bold mb-8 leading-relaxed">
                El cronómetro se reiniciará a 0:00 y se pausará automáticamente para que inicies el nuevo tiempo cuando estés listo.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={confirmPeriodChange}
                  className="w-full bg-primary text-white font-black py-5 rounded-2xl active:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  CONFIRMAR INICIO {periodToConfirm}Q
                </button>
                <button
                  onClick={() => setPeriodToConfirm(null)}
                  className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest"
                >
                  Mantener período actual
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showNoteModal && (
        <Portal>
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-6 rounded-[32px] shadow-2xl">
              <h3 className="contrail-font text-[10px] font-black text-white uppercase tracking-widest mb-4">Nueva Observación</h3>
              <textarea autoFocus className="w-full h-32 bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary transition-colors text-sm" placeholder="Escribe aquí..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveTextNote} className="flex-1 bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase">GUARDAR</button>
                <button onClick={() => setShowNoteModal(false)} className="px-6 bg-white/10 text-white font-bold rounded-2xl text-[10px] uppercase">Cerrar</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Editar Acción */}
      {eventToEdit && (
        <Portal>
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-6 rounded-[32px] shadow-2xl">
              <h3 className="contrail-font text-[10px] font-black text-white uppercase tracking-widest mb-2">Editar Acción</h3>
              <p className="text-[9px] font-black text-primary mb-4 uppercase">{eventToEdit.type} - {eventToEdit.gameTime}</p>
              <textarea
                autoFocus
                className="w-full h-32 bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary transition-colors text-sm"
                placeholder="Editar detalles..."
                defaultValue={eventToEdit.transcription || eventToEdit.details}
                onBlur={(e) => eventToEdit && (eventToEdit.details = e.target.value)}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => eventToEdit && updateEventDetails(eventToEdit.id, eventToEdit.details || "")}
                  className="flex-1 bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase"
                >
                  GUARDAR CAMBIOS
                </button>
                <button
                  onClick={() => setEventToEdit(null)}
                  className="px-6 bg-white/10 text-white font-bold rounded-2xl text-[10px] uppercase"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Confirmar Salida (Anular Juego) */}
      {showExitConfirm && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200 text-center">
              <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <h3 className="contrail-font contrail-font text-2xl text-white uppercase mb-2">¿Anular Juego?</h3>
              <p className="text-[11px] font-bold text-white uppercase leading-relaxed mb-8">
                Si regresas al dashboard ahora, el progreso actual se perderá y el juego no se guardará en el historial.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onAnnulGame();
                    navigate('/dashboard');
                  }}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase shadow-lg shadow-red-200 transition-all"
                >
                  SÍ, ANULAR Y SALIR
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase border border-white/10 transition-all"
                >
                  CONTINUAR JUGANDO
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Reanudar Partido */}
      {showResumePrompt && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200 text-center">
              <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-hourglass-half"></i></div>
              <h3 className="contrail-font contrail-font text-2xl text-white uppercase mb-2">Partido en Curso</h3>
              <p className="text-[11px] font-bold text-white uppercase leading-relaxed mb-8">
                Tienes un partido sin finalizar guardado localmente. ¿Deseas continuar el partido anterior o empezar uno nuevo?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (pendingActiveGame) {
                      setGame(pendingActiveGame.game);
                      setSeconds(pendingActiveGame.seconds);
                      setPeriod(pendingActiveGame.period);
                      setPossession(pendingActiveGame.possession);
                      setLocalPossessionTime(pendingActiveGame.localPossessionTime);
                      setAwayPossessionTime(pendingActiveGame.awayPossessionTime);
                      setPassCount(pendingActiveGame.passCount);
                      setIsRunning(pendingActiveGame.isRunning);
                      if (pendingActiveGame.game.activeTacticId) setActiveTacticId(pendingActiveGame.game.activeTacticId);
                    }
                    setShowResumePrompt(false);
                  }}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase shadow-lg shadow-primary/20 transition-all"
                >
                  CONTINUAR PARTIDO
                </button>
                <button
                  onClick={() => {
                    StorageService.clearActiveGame();
                    onAnnulGame();
                    navigate('/new-game');
                  }}
                  className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl active:scale-95 text-xs uppercase border border-red-200 transition-all hover:bg-red-100"
                >
                  EMPEZAR UNO NUEVO
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Confirmar Finalizar Juego */}
      {showFinishConfirm && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200 text-center">
              <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-flag-checkered"></i></div>
              <h3 className="contrail-font contrail-font text-2xl text-white uppercase mb-2">¿Finalizar Partido?</h3>
              <p className="text-[11px] font-bold text-white uppercase leading-relaxed mb-8">
                Esta acción cerrará el registro actual y generará el reporte final de estadísticas. ¿Estás seguro de proceder?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmFinishGame}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase shadow-lg shadow-primary/20 transition-all"
                >
                  SÍ, FINALIZAR MATCH
                </button>
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase border border-white/10 transition-all"
                >
                  CONTINUAR JUGANDO
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {isMenuOpen && (
        <Portal>
          <div className="fixed inset-0 z-[400] flex">
            <div className="absolute inset-0 bg-brandDark/20 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
            <aside className="relative w-72 h-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-r border-white/10 shadow-2xl flex flex-col p-8 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-lg font-black text-white uppercase tracking-[4px]">Menú</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                <button
                  onClick={handleFinishGame}
                  className="w-full text-left p-4 rounded-xl bg-primary/10 text-primary font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 mb-4 hover:bg-primary/20"
                >
                  <i className="fa-solid fa-flag-checkered text-white"></i> Finalizar Match
                </button>

                <div className="py-2 border-b border-white/10 mb-2">
                  <p className="contrail-font text-[9px] font-black text-white uppercase tracking-widest mb-3 px-4">Configuración de Vista</p>
                  <button
                    onClick={() => setIsLandscape(!isLandscape)}
                    className={`w-full text-left p-4 rounded-xl flex items-center justify-between font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${isLandscape ? 'bg-primary/5 text-primary' : 'hover:bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white'}`}
                  >
                    <span>{isLandscape ? 'Cancha Vertical' : 'Cancha Horizontal'}</span>
                  </button>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`w-full text-left p-4 rounded-xl flex items-center justify-between font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${isFlipped ? 'bg-primary/5 text-primary' : 'hover:bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white'}`}
                  >
                    <span>Invertir arcos</span>
                  </button>
                </div>

                <div className="py-2 border-b border-white/10 mb-2">
                  <p className="contrail-font text-[9px] font-black text-white uppercase tracking-widest mb-3 px-4">Modo de registro</p>
                  <button
                    onClick={() => {
                      const nextMode = (game?.registroMode || 'visual') === 'visual' ? 'botones' : 'visual';
                      setGame(prev => prev ? { ...prev, registroMode: nextMode } : null);
                      setSnackbar({ message: `Modo de registro cambiado a: ${nextMode === 'visual' ? 'Visual' : 'Botones'}`, visible: true });
                      setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
                    }}
                    className="w-full text-left p-4 rounded-xl flex items-center justify-between font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 hover:bg-white/5 border border-white/10 text-white"
                  >
                    <span>{(game?.registroMode || 'visual') === 'visual' ? 'Modo: Visual' : 'Modo: Botones'}</span>
                    <span className="text-[#38bdf8]"><i className="fa-solid fa-rotate"></i> Cambiar</span>
                  </button>
                </div>

                {["1: Configurar juego", "2: Configurar plantel", "3: Configurar acciones"].map((opt, i) => (
                  <button key={i} className="w-full text-left p-4 rounded-xl hover:bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95" onClick={() => setIsMenuOpen(false)}>{opt}</button>
                ))}
              </nav>
              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="w-full text-left p-4 bg-red-50 text-red-600 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-red-100 active:scale-95"
                >
                  <i className="fa-solid fa-house text-white"></i> Regresar al dashboard
                </button>
              </div>
            </aside>
          </div>
        </Portal>
      )}

      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-b border-white/10 shadow-sm z-[200]" style={{ flexShrink: 0 }}>
        <button onClick={() => setIsMenuOpen(true)} className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 group">
          <div className="w-6 h-0.5 bg-black" />
          <div className="w-6 h-0.5 bg-black" />
          <div className="w-4 h-0.5 bg-black self-start ml-1" />
        </button>
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-6 overflow-hidden">
          {/* Home Team Score Block */}
          <button
            onClick={() => selectPossession(Possession.HOME)}
            className={`px-4 md:px-6 py-2 rounded-2xl flex items-center gap-3 border transition-all duration-500 shadow-md ${possession === Possession.HOME
              ? 'scale-110 z-10 opacity-100 shadow-xl border-white/20'
              : 'scale-95 opacity-50 border-transparent'
              } ${!isRunning && possession === Possession.NONE && seconds === 0 ? 'animate-pulse border-white/40' : ''}`}
            style={{
              backgroundColor: game?.teamHome?.primaryColor || '#6d5dfc',
              color: game?.teamHome?.secondaryColor || '#ffffff'
            }}
          >
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider max-w-[80px] truncate">{game?.teamHome?.name || 'Local'}</span>
            <span className="text-2xl md:text-4xl font-black leading-none">{game?.scoreHome || 0}</span>
          </button>

          <NSeparator />

          {/* Away Team Score Block */}
          <button
            onClick={() => selectPossession(Possession.AWAY)}
            className={`px-4 md:px-6 py-2 rounded-2xl flex items-center flex-row-reverse gap-3 border transition-all duration-500 shadow-md ${possession === Possession.AWAY
              ? 'scale-110 z-10 opacity-100 shadow-xl border-white/20'
              : 'scale-95 opacity-50 border-transparent'
              } ${!isRunning && possession === Possession.NONE && seconds === 0 ? 'animate-pulse border-white/40' : ''}`}
            style={{
              backgroundColor: game?.teamAway?.primaryColor || '#ef4444',
              color: game?.teamAway?.secondaryColor || '#ffffff'
            }}
          >
            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider max-w-[80px] truncate">{game?.teamAway?.name || 'Visita'}</span>
            <span className="text-2xl md:text-4xl font-black leading-none">{game?.scoreAway || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="bg-primary/10 text-primary font-black px-3 py-2 rounded-xl text-xs md:text-sm active:scale-95 transition-all shadow-sm border border-primary/5 hover:bg-primary/20"
            >
              {period}Q
            </button>
            {showPeriodMenu && (
              <div className="absolute top-full right-0 mt-2 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 shadow-2xl rounded-2xl p-1.5 z-[300] flex flex-col min-w-[60px] animate-in zoom-in duration-150">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => handlePeriodRequest(q)}
                    className={`px-4 py-2.5 text-[10px] font-black rounded-xl transition-colors ${period === q ? 'bg-primary text-white shadow-md' : 'text-white hover:bg-[#1e293b]/45 backdrop-blur-md border border-white/10'}`}
                  >
                    {q}Q
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#1e293b]/45 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="hidden md:flex flex-col items-center gap-1.5 px-0.5 border-r border-white/10 pr-2">
              <div
                className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ${!navigator.onLine
                  ? 'bg-red-500 animate-pulse'
                  : syncQueueLength > 0
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-emerald-500 shadow-emerald-500/50'
                  }`}
                title={!navigator.onLine ? 'Desconectado' : syncQueueLength > 0 ? 'Sincronizando...' : 'Sincronizado'}
              />
              <span className="text-[6px] font-black text-white/40 uppercase tracking-tighter leading-none">
                {!navigator.onLine ? 'Off' : syncQueueLength > 0 ? 'Sync' : 'Cloud'}
              </span>
            </div>
            <p className="text-lg md:text-xl font-black text-primary tabular-nums leading-none">{formatTime(seconds)}</p>
            <button
              onClick={toggleTimer}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all text-sm font-black shadow-md ${isRunning ? 'bg-red-500 text-white' : 'bg-primary text-white animate-bounce-short'}`}
            >
              {isRunning ? '||' : '▶'}
            </button>
          </div>
        </div>
      </header>

      <main className="bg-[#1e293b]/45 backdrop-blur-md border border-white/10 overflow-hidden" style={{ flexGrow: 1, display: 'flex', minHeight: 0 }}>
        {isLoading || loadError || !game ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white/5">
            {loadError ? (
              <>
                <span className="text-4xl mb-4">⚠️</span>
                <p className="mb-6 font-bold text-white text-center">{loadError}</p>
                <button
                  onClick={() => {
                    StorageService.clearActiveGame();
                    window.location.reload();
                  }}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-md"
                >
                  Reiniciar Aplicación
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="contrail-font font-bold text-white uppercase tracking-widest text-xs animate-pulse">Cargando datos...</p>
              </>
            )}
          </div>
        ) : (
          <>
            {!isLandscape && (
              <aside className="hidden lg:flex w-[320px] flex-col p-5 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-r border-white/10 overflow-y-auto no-scrollbar">
                {isPressMode ? (
                  renderPressSidebarLeft()
                ) : (
                  <div className="flex flex-col gap-6 pb-10">
                    <h3 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 italic">Análisis en Tiempo Real</h3>

                    <EntryAnalysisCard
                      title="Ingresos al Área"
                      icon={<i className="fa-solid fa-arrow-right-to-bracket text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                      homeTotal={Object.values(statsArea.home).reduce((a: number, b: number) => a + b, 0)}
                      awayTotal={Object.values(statsArea.away).reduce((a: number, b: number) => a + b, 0)}
                    >
                      <SectorRectangle
                        label="Ingresos al área rival"
                        teamColor={game.teamAway.primaryColor || '#ef4444'}
                        stats={statsArea.home}
                        sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                        borderPosition="top"
                      />
                      <SectorRectangle
                        label="Ingresos del rival a mi área"
                        teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                        stats={statsArea.away}
                        sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                        borderPosition="bottom"
                      />
                    </EntryAnalysisCard>

                    <EntryAnalysisCard
                      title="Ingresos a 23 Yardas"
                      icon={<i className="fa-solid fa-bezier-curve text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                      homeTotal={Object.values(stats23.home).reduce((a: number, b: number) => a + b, 0)}
                      awayTotal={Object.values(stats23.away).reduce((a: number, b: number) => a + b, 0)}
                    >
                      <SectorRectangle
                        label="Ingresos a 23 yardas rival"
                        teamColor={game.teamAway.primaryColor || '#ef4444'}
                        stats={stats23.home}
                        sectors={['Izquierda', 'Centro', 'Derecha']}
                        borderPosition="top"
                        type="zone23"
                      />
                      <SectorRectangle
                        label="Ingresos del rival a mis 23 yardas"
                        teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                        stats={stats23.away}
                        sectors={['Izquierda', 'Centro', 'Derecha']}
                        borderPosition="bottom"
                        type="zone23"
                      />
                    </EntryAnalysisCard>

                    <StatComparisonCard
                      title="Córners Cortos"
                      icon={<i className="fa-solid fa-flag text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                      homeData={getDetailedStat(['CÓRNER CORTO'], game.teamHome.id)}
                      awayData={getDetailedStat(['CÓRNER CORTO'], game.teamAway.id)}
                      allEvents={game.events}
                      homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                      awayColor={game.teamAway.primaryColor || '#ef4444'}
                    />
                    <StatComparisonCard
                      title="Penales"
                      icon={<i className="fa-solid fa-bullseye text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                      homeData={getDetailedStat(['PENAL'], game.teamHome.id)}
                      awayData={getDetailedStat(['PENAL'], game.teamAway.id)}
                      allEvents={game.events}
                      homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                      awayColor={game.teamAway.primaryColor || '#ef4444'}
                    />

                    {/* Remates Totales Sidebar - MOVED FROM RIGHT */}
                    <div className="border-white p-4 rounded-[24px] border-[1px] border-white shadow-sm flex flex-col gap-3">
                      <div className={`flex justify-between items-center ${shotsTotalSidebarExpanded ? 'border-b border-white/10 pb-2' : ''}`}>
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-futbol text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>
                          <p className="contrail-font text-[15px] font-black text-white uppercase tracking-wider leading-none">Remates Totales</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-white">{landscapeShots.home}/{landscapeShots.away}</span>
                          <button
                            onClick={() => setShotsTotalSidebarExpanded(!shotsTotalSidebarExpanded)}
                            className={`w-5 h-5 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${shotsTotalSidebarExpanded ? 'rotate-180' : ''}`}
                          >
                            <span className="text-[8px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
                          </button>
                        </div>
                      </div>

                      {shotsTotalSidebarExpanded && (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-top duration-300">
                          <div className="flex items-center gap-3 py-1 border-b border-white/10/30">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                            <div className="grid grid-cols-3 flex-1 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Gol:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['GOL'], game.teamHome.id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Ata:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['ATAJADO'], game.teamHome.id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Des:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['DESVIADO'], game.teamHome.id)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 py-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                            <div className="grid grid-cols-3 flex-1 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Gol:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['GOL'], game.teamAway.id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Ata:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['ATAJADO'], game.teamAway.id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-lato text-[15px] font-bold text-white uppercase">Des:</span>
                                <span className="text-[16px] font-black text-white leading-none">{getStat(['DESVIADO'], game.teamAway.id)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            )}

            <div className={`flex-1 relative ${isLandscape ? 'p-0' : 'p-2'} flex gap-0 overflow-hidden min-w-0 min-h-0`}>
              {isLandscape && !isPressMode && (
                <aside className="hidden md:flex w-[80px] bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-r border-white/10 flex-col items-center py-4 gap-6 z-50 shadow-lg shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl"><i className="fa-solid fa-futbol"></i></span>
                    <span className="text-[12px] font-black">{landscapeShots.home}/{landscapeShots.away}</span>
                    <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Tiros</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">⚠️</span>
                    <span className="text-[12px] font-black">{landscapeFouls.home}/{landscapeFouls.away}</span>
                    <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Faltas</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl"><i className="fa-solid fa-arrow-trend-down"></i></span>
                    <span className="text-[12px] font-black">{turnoversHome}</span>
                    <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Pérd.</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl"><i className="fa-solid fa-arrow-trend-up"></i></span>
                    <span className="text-[12px] font-black">{stealsHome}</span>
                    <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Recup.</span>
                  </div>
                </aside>
              )}

              <div className="relative bg-white/5 overflow-hidden" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, minWidth: 0 }}>
                {activeView === 'list' ? (
                  <div className={`relative ${isLandscape ? 'w-[92%] h-[92%]' : 'w-full h-full'}`}>
                    <div className="w-full h-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 rounded-[32px] border-2 border-white/10 flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="contrail-font text-sm font-black text-white uppercase tracking-widest">Listado de Acciones</h3>
                        <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                      </div>
                      <FilterChips />
                      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-4">
                        {filteredEvents.map((e) => {
                          let title = e.type;
                          let subtitle = e.transcription || e.details || '';
                          const isOwn = e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME;

                          if (e.type.includes('DISPARO') || e.type.includes('GOL')) {
                            const baseTitle = isPressMode
                              ? (isOwn ? 'Disparo al arco / Local' : 'Disparo al arco / Visitante')
                              : (isOwn ? 'Disparo propio' : 'Disparo rival');
                            let outcome = '';
                            if (e.type.includes('GOL')) outcome = 'Gol';
                            else if (e.type.includes('ATAJADO')) outcome = 'Atajado';
                            else if (e.type.includes('DESVIADO')) outcome = 'Desviado';
                            title = outcome ? `${baseTitle} (${outcome})` : baseTitle;
                          } else if (e.type.includes('FALTA')) {
                            if (isPressMode) {
                              const teamLabel = isOwn ? 'Local' : 'Visitante';
                              title = `${teamLabel}: falta cometida`;
                            } else {
                              title = isOwn ? 'Falta propia' : 'Falta recibida';
                            }
                            const isCard = subtitle.includes('AMARILLA') || subtitle.includes('VERDE') || subtitle.includes('ROJA');
                            const isCortoPenal = subtitle.includes('Provoca C.Corto/Penal');
                            if (isCortoPenal) {
                              subtitle = 'Provoca Córner Corto o Penal';
                            } else if (!isCard && !e.transcription) {
                              subtitle = '';
                            }
                          }

                          return (
                            <div key={e.id} className="bg-[#1e293b]/45 backdrop-blur-md border border-white/10/60 border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-primary font-black text-xs bg-primary/10 px-2 py-1 rounded shrink-0">{e.gameTime}</span>
                                  <div className="flex items-center gap-2">
                                    {(e.type.includes('DISPARO') || e.type.includes('GOL') || e.type.includes('FALTA')) && (
                                      <span
                                        className="text-[10px] font-black px-2 py-0.5 rounded border border-current shrink-0 min-w-[24px] text-center"
                                        style={{
                                          color: isOwn ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                          borderColor: isOwn ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                          backgroundColor: isOwn ? `${game.teamHome.primaryColor || '#6d5dfc'}11` : `${game.teamAway.primaryColor || '#ef4444'}11`
                                        }}
                                      >
                                        {isOwn ? 'L' : 'V'}
                                      </span>
                                    )}
                                    <p className="text-white text-sm font-bold uppercase">{title}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setEventToEdit(e)} className="text-primary p-2">✏️</button>
                                  <button onClick={() => deleteEvent(e.id)} className="text-red-400 p-2">✕</button>
                                </div>
                              </div>
                              {e.isTranscribing ? (
                                <div className="flex items-center gap-2 py-2">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-xs font-bold text-primary animate-pulse tracking-widest uppercase">Transcribiendo...</span>
                                </div>
                              ) : subtitle ? (
                                <p className={`text-[10px] font-black uppercase ${e.transcription ? 'text-white italic bg-primary/5 p-3 rounded-xl border border-primary/10' : 'text-white'}`}>
                                  {subtitle}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : activeView === 'stats' ? (
                  isPressMode ? (
                    <div className={`relative ${isLandscape ? 'w-[92%] h-[92%]' : 'w-full h-full'}`}>
                      <div className="w-full h-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 rounded-[32px] border-2 border-white/10 flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="contrail-font text-sm font-black text-white uppercase tracking-widest font-contrail">Estadísticas de Transmisión</h3>
                          <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                        </div>
                        <div className="flex-grow overflow-y-auto no-scrollbar">
                          <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
                            {[{ id: 'ALL', label: 'Todo' }, { id: 1, label: '1Q' }, { id: 2, label: '2Q' }, { id: 3, label: '3Q' }, { id: 4, label: '4Q' }].map(p => (
                              <button
                                key={p.id}
                                onClick={() => setPeriodFilter(p.id as PeriodFilter)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${periodFilter === p.id
                                  ? 'bg-primary text-white border-primary shadow-md'
                                  : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/60 border-white/10 hover:border-primary/40'
                                  }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                          {renderPressStatsContent(true)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`relative ${isLandscape ? 'w-[92%] h-[92%]' : 'w-full h-full'}`}>
                      <div className="w-full h-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 rounded-[32px] border-2 border-white/10 flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="contrail-font text-sm font-black text-white uppercase tracking-widest">Estadísticas Detalladas</h3>
                          <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                          <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
                            {[{ id: 'ALL', label: 'Todo' }, { id: 1, label: '1Q' }, { id: 2, label: '2Q' }, { id: 3, label: '3Q' }, { id: 4, label: '4Q' }].map(p => (
                              <button
                                key={p.id}
                                onClick={() => setPeriodFilter(p.id as PeriodFilter)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${periodFilter === p.id
                                  ? 'bg-primary text-white border-primary shadow-md'
                                  : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/60 border-white/10 hover:border-primary/40'
                                  }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          <div className="border-white p-6 rounded-[24px] border-[1px] border-white mb-6 shadow-inner flex flex-col gap-4">
                            <div className={`flex justify-between items-center ${possessionExpanded ? 'border-b border-white/10 pb-3' : ''}`}>
                              <div className="flex items-center gap-2">
                                <i className="fa-solid fa-stopwatch text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>
                                <h4 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">Posesión</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-white">{localPct}% / {awayPct}%</span>
                                <button
                                  onClick={() => setPossessionExpanded(!possessionExpanded)}
                                  className={`w-6 h-6 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${possessionExpanded ? 'rotate-180' : ''}`}
                                >
                                  <span className="text-[10px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
                                </button>
                              </div>
                            </div>

                            {possessionExpanded && (
                              <div className="animate-in slide-in-from-top duration-300">
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                                    <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">Posesión Local</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">Posesión Visita</span>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                                  </div>
                                </div>
                                <div className="w-full h-10 bg-white/5 rounded-2xl overflow-hidden flex shadow-inner border border-white/10">
                                  <div
                                    className="h-full transition-all duration-700 ease-out flex items-center justify-center text-[16px] font-black text-white drop-shadow-sm"
                                    style={{ width: `${localPct}%`, backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}
                                  >
                                    {localPct > 15 && `${localPct}%`}
                                  </div>
                                  <div
                                    className="h-full transition-all duration-700 ease-out flex items-center justify-center text-[16px] font-black text-white drop-shadow-sm"
                                    style={{ width: `${awayPct}%`, backgroundColor: game.teamAway.primaryColor || '#ef4444' }}
                                  >
                                    {awayPct > 15 && `${awayPct}%`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Remates Totales Unificados */}
                            <div className="border-white p-5 rounded-[28px] border-[1px] border-white shadow-sm flex flex-col gap-4">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <i className="fa-solid fa-futbol text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>
                                  <p className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">Remates Totales</p>
                                </div>
                                <div className="text-2xl font-black text-white">
                                  {getStat(['DISPARO'], game.teamHome.id)} <span className="text-white/40">-</span> {getStat(['DISPARO'], game.teamAway.id)}
                                </div>
                              </div>

                              <div className="flex flex-col gap-4">
                                {/* Local */}
                                <div className="bg-[#1e293b]/45 backdrop-blur-md border border-white p-4 border-[1px] border-white flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex items-center gap-3 w-full md:w-1/4">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                                    <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">{game.teamHome.name}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 md:gap-4 flex-1 w-full">
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Gol</p>
                                      <p className="text-lg font-black text-white">{getStat(['GOL'], game.teamHome.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['GOL'], game.teamHome.id) / (getStat(['DISPARO'], game.teamHome.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Atajado</p>
                                      <p className="text-lg font-black text-white">{getStat(['ATAJADO'], game.teamHome.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['ATAJADO'], game.teamHome.id) / (getStat(['DISPARO'], game.teamHome.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Desv.</p>
                                      <p className="text-lg font-black text-white">{getStat(['DESVIADO'], game.teamHome.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['DESVIADO'], game.teamHome.id) / (getStat(['DISPARO'], game.teamHome.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                  </div>
                                </div>

                                {/* Visitante */}
                                <div className="bg-[#1e293b]/45 backdrop-blur-md border border-white p-4 border-[1px] border-white flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex items-center gap-3 w-full md:w-1/4">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                                    <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">{game.teamAway.name}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 md:gap-4 flex-1 w-full">
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Gol</p>
                                      <p className="text-lg font-black text-white">{getStat(['GOL'], game.teamAway.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['GOL'], game.teamAway.id) / (getStat(['DISPARO'], game.teamAway.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Atajado</p>
                                      <p className="text-lg font-black text-white">{getStat(['ATAJADO'], game.teamAway.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['ATAJADO'], game.teamAway.id) / (getStat(['DISPARO'], game.teamAway.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                    <div className="text-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10/30 p-2 rounded-xl shadow-sm border border-white/10/30">
                                      <p className="font-lato text-[15px] font-bold text-white opacity-60 uppercase mb-0.5">Desv.</p>
                                      <p className="text-lg font-black text-white">{getStat(['DESVIADO'], game.teamAway.id)} <span className="text-[9px] opacity-50">({Math.round((getStat(['DESVIADO'], game.teamAway.id) / (getStat(['DISPARO'], game.teamAway.id) || 1)) * 100)}%)</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="flex flex-col gap-4">
                                <h4 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider px-2 italic">Local</h4>
                                <StatDetailCard title="Pérdidas" icon={<i className="fa-solid fa-arrow-trend-down text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} data={getDetailedStat(['PÉRDIDA', 'PERDIDA', 'TURNOVER'], game.teamHome.id)} colorClass="text-orange-600" />
                                <StatDetailCard title="Recuperos" icon={<i className="fa-solid fa-arrow-trend-up text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} data={getDetailedStat(['RECUPERO'], game.teamHome.id)} colorClass="text-emerald-600" />
                                <StatDetailCard title="Faltas" icon={<i className="fa-solid fa-triangle-exclamation text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} data={getDetailedStat(['FALTA'], game.teamHome.id)} colorClass="text-red-600" />
                              </div>
                            </div>

                            {/* Ingresos al Área */}
                            <EntryAnalysisCard
                              title="Ingresos al Área"
                              icon={<i className="fa-solid fa-arrow-right-to-bracket text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                              homeTotal={Object.values(statsArea.home).reduce((a: number, b: number) => a + b, 0)}
                              awayTotal={Object.values(statsArea.away).reduce((a: number, b: number) => a + b, 0)}
                            >
                              <SectorRectangle
                                label="Ingresos a área rival"
                                teamColor={game.teamAway.primaryColor || '#ef4444'}
                                stats={statsArea.home}
                                sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                                borderPosition="top"
                              />
                              <SectorRectangle
                                label="Ingresos del rival a mi área"
                                teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                                stats={statsArea.away}
                                sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                                borderPosition="bottom"
                              />
                            </EntryAnalysisCard>

                            {/* Ingresos a 23 Yardas */}
                            <EntryAnalysisCard
                              title="Ingresos a 23 Yardas"
                              icon={<i className="fa-solid fa-bezier-curve text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                              homeTotal={Object.values(stats23.home).reduce((a: number, b: number) => a + b, 0)}
                              awayTotal={Object.values(stats23.away).reduce((a: number, b: number) => a + b, 0)}
                            >
                              <SectorRectangle
                                label="Ingresos a 23 yardas rival"
                                teamColor={game.teamAway.primaryColor || '#ef4444'}
                                stats={stats23.home}
                                sectors={['Izquierda', 'Centro', 'Derecha']}
                                borderPosition="top"
                                type="zone23"
                              />
                              <SectorRectangle
                                label="Ingresos del rival a mis 23 yardas"
                                teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                                stats={stats23.away}
                                sectors={['Izquierda', 'Centro', 'Derecha']}
                                borderPosition="bottom"
                                type="zone23"
                              />
                            </EntryAnalysisCard>

                            <StatComparisonCard
                              title="Córners Cortos"
                              icon={<i className="fa-solid fa-flag text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                              homeData={getDetailedStat(['CÓRNER CORTO'], game.teamHome.id)}
                              awayData={getDetailedStat(['CÓRNER CORTO'], game.teamAway.id)}
                              allEvents={game.events}
                              homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                              awayColor={game.teamAway.primaryColor || '#ef4444'}
                            />
                            <StatComparisonCard
                              title="Penales"
                              icon={<i className="fa-solid fa-bullseye text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                              homeData={getDetailedStat(['PENAL'], game.teamHome.id)}
                              awayData={getDetailedStat(['PENAL'], game.teamAway.id)}
                              allEvents={game.events}
                              homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                              awayColor={game.teamAway.primaryColor || '#ef4444'}
                            />
                          </div>

                          <div className="mt-8 mb-6">
                            <h3 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2 italic flex items-center gap-2">
                              <i className="fa-solid fa-magnifying-glass-arrow-right text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i> Análisis de Pases
                            </h3>

                            <div className="flex flex-row items-stretch gap-3">
                              <div className="flex-1 border-white p-4 rounded-[24px] border-[1px] border-white text-center shadow-inner flex flex-col justify-center min-h-[100px]">
                                <p className="font-lato text-[15px] font-bold text-white uppercase mb-1">Mínimo</p>
                                <p className="text-3xl font-black text-white leading-none">{pMin}</p>
                                {minPassEvent && (
                                  <p className="text-[7px] font-bold text-white/50 uppercase mt-1 leading-tight">
                                    {minPassEvent.gameTime}
                                  </p>
                                )}
                              </div>

                              <div className="flex-[1.2] bg-primary p-4 rounded-[28px] shadow-xl shadow-primary/20 text-center flex flex-col justify-center border-2 border-white min-h-[110px]">
                                <p className="font-lato text-[15px] font-bold text-white/70 uppercase mb-1">Promedio</p>
                                <p className="text-5xl font-black text-white leading-none">{pAvg}</p>
                                <p className="font-lato text-[12px] font-bold text-white uppercase mt-1 tracking-widest">Pases / Cadena</p>
                              </div>

                              <div className="flex-1 border-white p-4 rounded-[24px] border-[1px] border-white text-center shadow-inner flex flex-col justify-center min-h-[100px]">
                                <p className="font-lato text-[15px] font-bold text-white uppercase mb-1">Máximo</p>
                                <p className="text-3xl font-black text-white leading-none">{pMax}</p>
                                {maxPassEvent && (
                                  <p className="text-[7px] font-bold text-white/50 uppercase mt-1 leading-tight">
                                    {maxPassEvent.gameTime}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : isPressMode ? (
                    renderPressLayout()
                  ) : game?.registroMode === 'botones' ? (
                    <div className="w-full h-full p-2 sm:p-4 flex flex-col items-center justify-center min-h-0 min-w-0">
                      <div
                        className="w-full h-full max-w-4xl bg-[#131041]/40 backdrop-blur-[16px] border border-white/10 rounded-[32px] p-3 sm:p-5 flex flex-col justify-between shadow-2xl relative min-h-0 min-w-0 overflow-hidden"
                      >
                        {/* Header of buttons panel */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2 sm:mb-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></div>
                            <span className="font-black text-[10px] sm:text-xs text-white uppercase tracking-widest font-contrail">Modo Botones Tácticos</span>
                          </div>
                          <span className="text-[9px] font-black text-white/40 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Carril: {selectedLane === 'left' ? 'Izquierda' : selectedLane === 'right' ? 'Derecha' : 'Centro'} | Zona: {selectedZone === 'rival' ? 'Rival' : 'Propia'}
                          </span>
                        </div>

                        {/* Fila 1: Controladores de Ubicación Espacial */}
                        <div className="flex flex-row gap-3 w-full mb-3 shrink-0">
                          {/* Segmented Control 1: Zona (Campo Rival / Campo Propio) */}
                          <div className="flex-1 flex bg-white/5 border border-white/10 rounded-2xl p-0.5 h-11 shadow-inner relative overflow-hidden backdrop-blur-md">
                            <button
                              onClick={() => setSelectedZone('rival')}
                              className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-xl ${selectedZone === 'rival'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-black shadow-[inset_0_0_8px_rgba(56,189,248,0.25)] border border-[#38bdf8]/30'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              Campo Rival
                            </button>
                            <button
                              onClick={() => setSelectedZone('own')}
                              className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-xl ${selectedZone === 'own'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-black shadow-[inset_0_0_8px_rgba(56,189,248,0.25)] border border-[#38bdf8]/30'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              Campo Propio
                            </button>
                          </div>

                          {/* Segmented Control 2: Carril (Izquierda / Centro / Derecha) */}
                          <div className="flex-[1.3] flex bg-white/5 border border-white/10 rounded-2xl p-0.5 h-11 shadow-inner relative overflow-hidden backdrop-blur-md">
                            <button
                              onClick={() => setSelectedLane('left')}
                              className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-xl ${selectedLane === 'left'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-black shadow-[inset_0_0_8px_rgba(56,189,248,0.25)] border border-[#38bdf8]/30'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              Izquierda
                            </button>
                            <button
                              onClick={() => setSelectedLane('center')}
                              className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-xl ${selectedLane === 'center'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-black shadow-[inset_0_0_8px_rgba(56,189,248,0.25)] border border-[#38bdf8]/30'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              Centro
                            </button>
                            <button
                              onClick={() => setSelectedLane('right')}
                              className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-xl ${selectedLane === 'right'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-black shadow-[inset_0_0_8px_rgba(56,189,248,0.25)] border border-[#38bdf8]/30'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              Derecha
                            </button>
                          </div>
                        </div>

                        {/* Lógica Dinámica de Posesión y Bloques Verticales */}
                        <div className="flex-1 flex flex-col justify-between gap-3 min-h-0 w-full">
                          {/* Bloque Local */}
                          {(() => {
                            const isLocalPossession = possession === Possession.HOME;
                            const categories = isLocalPossession ? actionsSchema.HOME.local : actionsSchema.AWAY.local;
                            const primaryColor = game.teamHome.primaryColor || '#6d5dfc';

                            return (
                              <div
                                className={`flex-1 flex flex-col p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 min-h-0 overflow-hidden ${isLocalPossession
                                  ? 'shadow-[0_0_12px_rgba(109,93,252,0.15)] border-white/20'
                                  : 'border-white/5 opacity-80'
                                  }`}
                                style={{
                                  backgroundColor: `${primaryColor}0f`,
                                  borderColor: isLocalPossession ? `${primaryColor}35` : `${primaryColor}12`
                                }}
                              >
                                <div className="flex justify-between items-center mb-1.5 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                                    <span className="font-black text-xs text-white uppercase tracking-wider font-contrail">
                                      {game.teamHome.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${isLocalPossession
                                      ? 'bg-[#00fe00]/10 text-[#00fe00] border-[#00fe00]/20 animate-pulse shadow-[0_0_8px_rgba(0,254,0,0.15)]'
                                      : 'bg-white/5 text-white/30 border-white/5'
                                      }`}
                                  >
                                    {isLocalPossession ? '● ATACANDO' : 'DEFENDIENDO'}
                                  </span>
                                </div>

                                <div className="flex-1 flex flex-col justify-center min-h-0">
                                  {categories.length === 1 ? (
                                    <div className="w-full flex flex-col justify-center">
                                      <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-white/60 mb-1.5 block">
                                        {categories[0].name}
                                      </span>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {categories[0].buttons.map(btn => renderActionButton(btn, primaryColor))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 h-full items-stretch content-center">
                                      {categories.map(cat => (
                                        <div key={cat.id} className="flex flex-col bg-white/5 border border-white/5 rounded-xl p-1.5 sm:p-2 justify-between min-h-0">
                                          <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-white/60 mb-1.5 truncate block" title={cat.name}>
                                            {cat.name}
                                          </span>
                                          <div className="grid grid-cols-3 gap-1">
                                            {cat.buttons.map(btn => renderActionButton(btn, primaryColor))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Bloque Visitante */}
                          {(() => {
                            const isAwayPossession = possession === Possession.AWAY;
                            const categories = isAwayPossession ? actionsSchema.AWAY.visitante : actionsSchema.HOME.visitante;
                            const primaryColor = game.teamAway.primaryColor || '#ef4444';

                            return (
                              <div
                                className={`flex-1 flex flex-col p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 min-h-0 overflow-hidden ${isAwayPossession
                                  ? 'shadow-[0_0_12px_rgba(239,68,68,0.15)] border-white/20'
                                  : 'border-white/5 opacity-80'
                                  }`}
                                style={{
                                  backgroundColor: `${primaryColor}0f`,
                                  borderColor: isAwayPossession ? `${primaryColor}35` : `${primaryColor}12`
                                }}
                              >
                                <div className="flex justify-between items-center mb-1.5 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                                    <span className="font-black text-xs text-white uppercase tracking-wider font-contrail">
                                      {game.teamAway.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${isAwayPossession
                                      ? 'bg-[#00fe00]/10 text-[#00fe00] border-[#00fe00]/20 animate-pulse shadow-[0_0_8px_rgba(0,254,0,0.15)]'
                                      : 'bg-white/5 text-white/30 border-white/5'
                                      }`}
                                  >
                                    {isAwayPossession ? '● ATACANDO' : 'DEFENDIENDO'}
                                  </span>
                                </div>

                                <div className="flex-1 flex flex-col justify-center min-h-0">
                                  {categories.length === 1 ? (
                                    <div className="w-full flex flex-col justify-center">
                                      <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-white/60 mb-1.5 block">
                                        {categories[0].name}
                                      </span>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {categories[0].buttons.map(btn => renderActionButton(btn, primaryColor))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 h-full items-stretch content-center">
                                      {categories.map(cat => (
                                        <div key={cat.id} className="flex flex-col bg-white/5 border border-white/5 rounded-xl p-1.5 sm:p-2 justify-between min-h-0">
                                          <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-white/60 mb-1.5 truncate block" title={cat.name}>
                                            {cat.name}
                                          </span>
                                          <div className="grid grid-cols-3 gap-1">
                                            {cat.buttons.map(btn => renderActionButton(btn, primaryColor))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div
                    key={`pitch-wrapper-${orientationTrigger}`}
                    className="relative flex items-center justify-center mx-auto"
                    style={{
                      aspectRatio: isLandscape ? '5 / 3' : '3 / 5',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      margin: 'auto'
                    }}
                  >
                    <PitchMap
                      possession={possession}
                      isRunning={isRunning}
                      isLandscape={isLandscape}
                      isFlipped={isFlipped}
                      teamHome={game?.teamHome}
                      teamAway={game?.teamAway}
                      onAction={handlePitchAction}
                      onManualMenu={handleManualMenu}
                    />

                    {feedback && (() => {
                      let dispX = feedback.x;
                      let dispY = feedback.y;

                      if (isFlipped) {
                        dispX = 100 - dispX;
                        dispY = 100 - dispY;
                      }
                      if (isLandscape) {
                        const temp = dispX;
                        dispX = dispY;
                        dispY = 100 - temp;
                      }

                      const isNearTop = dispY < 15;

                      let leftPos = `${dispX}%`;
                      let hTransform = '-translate-x-1/2';
                      if (dispX < 15) {
                        leftPos = '20px';
                        hTransform = 'translate-x-0';
                      } else if (dispX > 85) {
                        leftPos = 'calc(100% - 20px)';
                        hTransform = '-translate-x-full';
                      }

                      return (
                        <div
                          key={feedback.id}
                          className="absolute z-[400] pointer-events-none transition-all duration-200"
                          style={{
                            left: leftPos,
                            top: `${dispY}%`,
                            opacity: feedback.fading ? 0 : 1,
                            transform: feedback.fading ? 'scale(0.95)' : 'scale(1)',
                          }}
                        >
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10/80 backdrop-blur-md border border-white/50 shadow-lg ${hTransform} ${isNearTop ? 'translate-y-4' : '-translate-y-10'} ${feedback.fading ? '' : 'animate-in zoom-in slide-in-from-bottom-2 duration-200'}`}>
                            <span className="text-sm">{feedback.icon}</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">{feedback.text}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {showPopup && (
                      <Portal>
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                          <div
                            className="relative bg-[#1e293b]/45 backdrop-blur-md border border-white/10 shadow-2xl rounded-[40px] p-8 flex flex-col gap-4 min-w-[300px] max-w-sm border border-white/10 animate-in zoom-in duration-200 text-center"
                            onClick={e => e.stopPropagation()}
                          >
                            <p className="contrail-font text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 mb-2">Resultado de Acción</p>
                            {showPopup.type === 'FOUL' ? (
                              <div className="flex flex-col gap-3">
                                {foulCardType === 'AMARILLA' ? (
                                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                                    <div className="flex flex-col gap-2">
                                      <label className="text-[8px] font-bold text-white uppercase">Jugador #</label>
                                      <input
                                        type="text"
                                        value={foulPlayer}
                                        onChange={(e) => setFoulPlayer(e.target.value)}
                                        className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                                        placeholder="Ej: 8"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2 bg-yellow-50/50 p-2 rounded-xl border border-yellow-100">
                                      <label className="text-[7px] font-black text-yellow-700 uppercase">Minutos Sanción (Amarilla)</label>
                                      <input
                                        type="text"
                                        value={foulMinutes}
                                        onChange={(e) => setFoulMinutes(e.target.value)}
                                        className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-yellow-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-yellow-400"
                                        placeholder="Ej: 5"
                                      />
                                    </div>
                                    <button
                                      className="w-full py-3 rounded-xl bg-yellow-400 text-white font-black text-xs uppercase shadow-lg shadow-yellow-100 active:scale-95 transition-all"
                                      onClick={() => updateLastEvent('FALTA (AMARILLA) / PÉRDIDA', `AMARILLA${foulMinutes ? ` (${foulMinutes} minutos)` : ''}${foulPlayer ? ` - Jugador #${foulPlayer}` : ''}`)}
                                    >
                                      Confirmar Amarilla
                                    </button>
                                    <button
                                      className="text-[8px] font-black text-white uppercase text-center py-1 hover:text-primary transition-colors"
                                      onClick={() => setFoulCardType('NONE')}
                                    >
                                      Atrás
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <button className="text-[10px] font-black text-white py-3 rounded-xl bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 flex flex-col items-center justify-center gap-1.5 hover:bg-green-50 transition-colors" onClick={() => updateLastEvent('FALTA (VERDE)', 'VERDE')}>
                                        <span className="w-5 h-7 bg-green-500 rounded-sm shadow-sm"></span>
                                        <span>VERDE</span>
                                      </button>
                                      <button className="text-[10px] font-black text-white py-3 rounded-xl bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 flex flex-col items-center justify-center gap-1.5 hover:bg-yellow-50 transition-colors" onClick={() => setFoulCardType('AMARILLA')}>
                                        <span className="w-5 h-7 bg-yellow-400 rounded-sm shadow-sm"></span>
                                        <span>AMARILLA</span>
                                      </button>
                                      <button className="text-[10px] font-black text-white py-3 rounded-xl bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 flex flex-col items-center justify-center gap-1.5 hover:bg-red-50 transition-colors" onClick={() => updateLastEvent('FALTA (ROJA)', 'ROJA')}>
                                        <span className="w-5 h-7 bg-red-600 rounded-sm shadow-sm"></span>
                                        <span>ROJA</span>
                                      </button>
                                      <button
                                        className="text-[10px] font-black text-white py-3 rounded-xl bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
                                        onClick={() => updateLastEvent('FALTA COMETIDA', 'Sin tarjeta')}
                                      >
                                        <div className="w-5 h-7 border-2 border-dashed border-onSurfaceVariant/30 rounded-sm flex items-center justify-center">
                                          <span className="text-[8px] text-white/40">✕</span>
                                        </div>
                                        <span>SIN TARJETA</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : showPopup.type === 'CORTO_PENAL' ? (
                              <div className="flex flex-col gap-2">
                                <button className="text-[10px] font-black text-indigo-600 py-3 rounded-xl bg-indigo-50 border border-indigo-100 uppercase flex items-center justify-center gap-2" onClick={() => registerEvent('CÓRNER CORTO', possession, showPopup.x, showPopup.y, "Córner Corto a Favor")}><i className="fa-solid fa-hockey-puck"></i> C. CORTO</button>
                                <button className="text-[10px] font-black text-purple-600 py-3 rounded-xl bg-purple-50 border border-purple-100 uppercase flex items-center justify-center gap-2" onClick={() => registerEvent('PENAL', possession, showPopup.x, showPopup.y, "Penal a Favor")}><i className="fa-solid fa-bullseye"></i> PENAL</button>
                              </div>
                            ) : showPopup.type === 'SHOT' ? (
                              <div className="flex flex-col gap-3 relative">
                                <button
                                  onClick={handleClosePopup}
                                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors font-black"
                                >
                                  ✕
                                </button>
                                <p className="text-[9px] font-black text-white uppercase mb-1">Resultado del Remate</p>

                                <div className="grid grid-cols-3 gap-2 mb-1">
                                  <button
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all border ${selectedShotAction === 'GOL' ? 'bg-primary text-white border-primary shadow-md' : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white border-white/10'}`}
                                    onClick={() => setSelectedShotAction('GOL')}
                                  >
                                    <span className="text-sm"><i className="fa-solid fa-futbol"></i></span> GOL
                                  </button>
                                  <button
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all border ${selectedShotAction === 'ATAJADO' ? 'bg-primary text-white border-primary shadow-md' : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white border-white/10'}`}
                                    onClick={() => setSelectedShotAction('ATAJADO')}
                                  >
                                    <span className="text-sm"><i className="fa-solid fa-shield-halved"></i></span> ATAJADO
                                  </button>
                                  <button
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all border ${selectedShotAction === 'DESVIADO' ? 'bg-primary text-white border-primary shadow-md' : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white border-white/10'}`}
                                    onClick={() => setSelectedShotAction('DESVIADO')}
                                  >
                                    <span className="text-sm"><i className="fa-solid fa-wind"></i></span> DESV.
                                  </button>
                                </div>

                                {selectedShotAction === 'ATAJADO' && (
                                  <div className="flex flex-col gap-2 mb-1 animate-in slide-in-from-top duration-200">
                                    <p className="text-[8px] font-bold text-white uppercase">Posesión tras el atajo:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${atajadoPossession === 'MANTIENE' ? 'bg-green-500 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200'}`}
                                        onClick={() => setAtajadoPossession('MANTIENE')}
                                      >
                                        Mantiene
                                      </button>
                                      <button
                                        className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${atajadoPossession === 'PIERDE' ? 'bg-red-500 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200'}`}
                                        onClick={() => setAtajadoPossession('PIERDE')}
                                      >
                                        Pierde
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-col gap-2 mt-2">
                                  <label className="text-[8px] font-bold text-white uppercase">Jugador #</label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={foulPlayer}
                                    onChange={(e) => setFoulPlayer(e.target.value)}
                                    className="w-full bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                                    placeholder="Ej: 8"
                                  />
                                </div>

                                <div className="flex flex-col gap-2 mb-2">
                                  <label className="text-[8px] font-bold text-white uppercase">Origen de la jugada</label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { id: 'Individual', label: 'Indiv.' },
                                      { id: 'Colectiva', label: 'Colect.' },
                                      { id: 'Penal', label: 'Penal' },
                                      { id: 'Corto', label: 'C. Corto' },
                                    ].map((type) => (
                                      <button
                                        key={type.id}
                                        onClick={() => setGoalType(type.id as any)}
                                        className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all ${goalType === type.id
                                          ? 'bg-primary text-white shadow-sm'
                                          : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 text-white'
                                          }`}
                                      >
                                        {type.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  className={`w-full py-4 mt-2 rounded-xl font-black text-xs uppercase shadow-md transition-all ${(selectedShotAction && (selectedShotAction !== 'ATAJADO' || atajadoPossession))
                                    ? 'bg-primary text-white active:scale-95'
                                    : 'bg-white/10 text-white/50 opacity-50 cursor-not-allowed'
                                    }`}
                                  disabled={!selectedShotAction || (selectedShotAction === 'ATAJADO' && !atajadoPossession)}
                                  onClick={() => {
                                    if (selectedShotAction === 'GOL') {
                                      handleGoalConfirmation(showPopup.targetGoal === 'TOP' ? { home: 1, away: 0 } : { home: 0, away: 1 }, showPopup.targetGoal === 'TOP' ? Possession.AWAY : Possession.HOME);
                                    } else if (selectedShotAction === 'ATAJADO') {
                                      if (atajadoPossession === 'MANTIENE') {
                                        updateLastEvent('DISPARO (ATAJADO)', `ATAJADO${foulPlayer ? ` (#${foulPlayer})` : ''} | Mantiene posesión`, undefined, possession);
                                      } else {
                                        updateLastEvent('DISPARO (ATAJADO)', `ATAJADO${foulPlayer ? ` (#${foulPlayer})` : ''} | Pierde posesión`, undefined, possession === Possession.HOME ? Possession.AWAY : Possession.HOME);
                                      }
                                    } else if (selectedShotAction === 'DESVIADO') {
                                      updateLastEvent('DISPARO (DESVIADO)', `DESVIADO${foulPlayer ? ` - Jugador #${foulPlayer}` : ''}`, undefined, possession === Possession.HOME ? Possession.AWAY : Possession.HOME);
                                    }
                                  }}
                                >
                                  Continuar
                                </button>
                              </div>
                            ) : null}

                            <button className="text-[8px] font-black text-white uppercase mt-4 text-center py-2 hover:text-primary transition-colors border-t border-white/10" onClick={handleClosePopup}>Cerrar</button>
                          </div>
                        </div>
                      </Portal>
                    )}

                    {!isRunning && possession === Possession.NONE && seconds === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 z-50">
                        <div
                          className="bg-[#1e293b]/45 backdrop-blur-md border border-white/10 p-8 rounded-[40px] shadow-2xl border border-white/10 max-w-xs transform animate-bounce-short"
                        >
                          <div className="text-4xl mb-4 text-white"><i className="fa-solid fa-hockey-puck"></i></div>
                          <h3 className="contrail-font contrail-font text-2xl text-white uppercase mb-2">¡Casi Listos!</h3>
                          <p className="text-[13px] font-bold text-white uppercase leading-relaxed tracking-wider">Selecciona qué equipo inicia con la posesión haciendo click en su marcador arriba.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isLandscape && !isPressMode && (
                <aside className="hidden md:flex w-[80px] bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-l border-white/10 flex-col items-center py-6 gap-6 z-50 shadow-lg shrink-0">
                  <p className="contrail-font text-[16px] font-black text-white uppercase tracking-wider leading-none mb-2">Notas</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVoiceNote(); }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md border-2 ${isRecording ? 'bg-red-600 text-white animate-pulse border-red-400' : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-primary text-primary'}`}
                  >
                    {isRecording ? '⏺' : '<i className="fa-solid fa-microphone"></i>'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNoteModal(true); }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-primary border-2 border-primary active:scale-90 shadow-md text-xl"
                  >
                    <i className="fa-solid fa-clipboard-list"></i>
                  </button>
                </aside>
              )}
            </div>

            {
              !isLandscape && (
                <aside className="hidden lg:flex w-[320px] flex-col p-4 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-l border-white/10 overflow-y-auto no-scrollbar">
                  {isPressMode ? (
                    renderPressSidebarRight()
                  ) : (
                    <div className="flex flex-col gap-4 pb-10">
                      <h3 className="contrail-font text-[16px] font-black text-white uppercase tracking-wider border-b border-white/10 pb-2 italic">Estadísticas En vivo</h3>

                      {/* Posesión Sidebar */}
                      <div className="border-white p-4 rounded-[24px] border-[1px] border-white shadow-inner flex flex-col gap-2">
                        <div className={`flex justify-between items-center ${possessionSidebarExpanded ? 'border-b border-white/10 pb-2 mb-1' : ''}`}>
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-stopwatch text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>
                            <p className="contrail-font text-[15px] font-black text-white uppercase tracking-wider leading-none">Posesión</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-white">{localPct}% / {awayPct}%</span>
                            <button
                              onClick={() => setPossessionSidebarExpanded(!possessionSidebarExpanded)}
                              className={`w-5 h-5 flex items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${possessionSidebarExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="text-[8px] text-white font-black" style={{ color: '#ffffff' }}>▼</span>
                            </button>
                          </div>
                        </div>

                        {possessionSidebarExpanded && (
                          <div className="animate-in slide-in-from-top duration-300">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                                {localPct}%
                              </span>
                              <span className="font-lato text-[15px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                {awayPct}%
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                              </span>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                              <div className="h-full transition-all duration-700" style={{ width: `${localPct}%`, backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                              <div className="h-full transition-all duration-700" style={{ width: `${awayPct}%`, backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                            </div>
                          </div>
                        )}
                      </div>


                      {/* Desgloses Detallados Sidebar */}
                      <StatDetailCard title="Pérdidas" data={getDetailedStat(['PÉRDIDA', 'PERDIDA', 'TURNOVER'], game.teamHome.id)} colorClass="text-orange-600" compact={true} icon={<i className="fa-solid fa-arrow-trend-down text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} />
                      <StatDetailCard title="Recuperos" data={getDetailedStat(['RECUPERO'], game.teamHome.id)} colorClass="text-emerald-600" compact={true} icon={<i className="fa-solid fa-arrow-trend-up text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} />
                      <StatDetailCard title="Faltas" data={getDetailedStat(['FALTA'], game.teamHome.id)} colorClass="text-red-600" compact={true} icon={<i className="fa-solid fa-triangle-exclamation text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>} />

                      {/* Análisis de Pases Sidebar Horizontal */}
                      <div className="mt-2">
                        <h3 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider mb-3 italic flex items-center gap-2">
                          <i className="fa-solid fa-magnifying-glass-arrow-right text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i> Análisis de Pases
                        </h3>
                        <div className="flex flex-row items-stretch gap-2 h-24">
                          <div className="flex-1 border-white p-2 rounded-2xl border-[1px] border-white text-center shadow-inner flex flex-col justify-center">
                            <p className="font-lato text-[15px] font-bold text-white uppercase mb-0.5">Mín</p>
                            <p className="text-xl font-black text-white leading-none">{pMin}</p>
                            {minPassEvent && <p className="text-[6px] font-bold text-white/40 mt-0.5 leading-none">{minPassEvent.gameTime}</p>}
                          </div>
                          <div className="flex-[1.2] bg-primary p-2 rounded-[20px] shadow-lg shadow-primary/10 text-center flex flex-col justify-center border-2 border-white">
                            <p className="font-lato text-[15px] font-bold text-white/60 uppercase mb-0.5">Prom</p>
                            <p className="text-3xl font-black text-white leading-none">{pAvg}</p>
                          </div>
                          <div className="flex-1 border-white p-2 rounded-2xl border-[1px] border-white text-center shadow-inner flex flex-col justify-center">
                            <p className="font-lato text-[15px] font-bold text-white uppercase mb-0.5">Máx</p>
                            <p className="text-xl font-black text-white leading-none">{pMax}</p>
                            {maxPassEvent && <p className="text-[6px] font-bold text-white/40 mt-0.5 leading-none">{maxPassEvent.gameTime}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </aside>
              )
            }
          </>
        )}
      </main >

      <footer className="h-20 md:h-24 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between px-4 md:px-10 border-t border-white/10 shadow-lg relative z-[200] gap-2" style={{ flexShrink: 0 }}>
        <div className="relative">
          <button className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-red-50 text-red-600 text-xl flex items-center justify-center border border-red-100 active:scale-90 shadow-sm" onClick={() => setUndoModal(true)}>↩</button>
          {undoModal && (
            <div className="absolute bottom-16 left-0 bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border border-white/10 p-5 rounded-[28px] shadow-2xl w-52 animate-in slide-in-from-bottom duration-200 z-[200]">
              <p className="text-[9px] text-white font-black uppercase mb-4 text-center">¿Deshacer?</p>
              <div className="flex gap-2.5">
                <button onClick={() => { if (game.events.length > 0) deleteEvent(game.events[game.events.length - 1].id); setUndoModal(false); }} className="flex-1 bg-red-600 text-white text-[9px] font-black py-3 rounded-xl uppercase">BORRAR</button>
                <button onClick={() => setUndoModal(false)} className="flex-1 bg-white/10 text-white text-[9px] font-black py-3 rounded-xl uppercase">NO</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-around md:justify-center md:gap-16">
          <div className="flex items-center gap-4 md:gap-8">
            <button className={`text-2xl transition-all ${activeView === 'list' ? 'text-primary scale-110 drop-shadow-md' : 'text-white/30'}`} onClick={() => setActiveView(activeView === 'list' ? 'field' : 'list')}><i className="fa-solid fa-list"></i></button>
            <button className={`text-2xl transition-all ${activeView === 'stats' ? 'text-primary scale-110 drop-shadow-md' : 'text-white/30'} ${!isLandscape ? 'lg:hidden' : ''}`} onClick={() => setActiveView(activeView === 'stats' ? 'field' : 'stats')}><i className="fa-solid fa-chart-simple"></i></button>
          </div>




          {!isLandscape && (
            <div className="flex items-center gap-4 md:gap-8">
              <button
                disabled
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm border bg-[#1e293b]/45 backdrop-blur-md border border-white/10 border-white/10 text-white/20 grayscale cursor-not-allowed opacity-50"
              >
                <i className="fa-solid fa-microphone"></i>
              </button>
              <button onClick={() => setShowNoteModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/40 border border-white/10 active:scale-90 shadow-sm text-xl"><i className="fa-solid fa-clipboard-list"></i></button>
            </div>
          )}
        </div>

        {!isPressMode && (
          <button
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl font-black shadow-xl relative transition-all active:scale-95 border-2 ${possession === Possession.HOME ? 'bg-primary text-white border-primary translate-y-[-4px]' : 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10 text-white/20 border-white/10'}`}
            onClick={() => isRunning && setPassCount(c => c + 1)}
            disabled={possession !== Possession.HOME || !isRunning}
          >
            <span>+</span>
            {passCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-secondary text-onSecondary text-[11px] w-7 h-7 flex items-center justify-center rounded-full border-[2px] border-white font-black animate-in zoom-in shadow-md">
                {passCount}
              </span>
            )}
          </button>
        )}
      </footer>
      {isPressMode && renderStartersModal()}
      {isPressMode && renderFoulOutcomeModal()}
      {isPressMode && renderAssignPlayerPopover()}
    </div >
  );
};

export default LiveGameView;
