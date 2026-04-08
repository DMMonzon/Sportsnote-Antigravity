
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';
import { UserRole, Game, GameEvent, Possession, TacticalScheme } from '../types';

import { PersistenceManager } from '../services/PersistenceManager';
import { aiService } from '../services/aiService';
import { StorageService } from '../services/StorageService';
import { PitchMap } from '../components/PitchMap';
import { db, auth, doc, setDoc } from '../services/firebase';
const NSeparator = () => (
  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0">
    <img
      src="./assets/logo-sportsnote-v2.png"
      alt="Sportsnote Logo"
      className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
    />
  </div>
);

const TacticIcon = ({ active, animated = false }: { active: boolean, animated?: boolean }) => (
  <div className="relative flex items-center justify-center">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-all ${active ? 'text-primary scale-110' : 'text-onSurfaceVariant/40'}`}>
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
    <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-surfaceVariant pb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-dark">{homeTotal}/{awayTotal}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <span className="text-[10px]">▼</span>
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

const StatDetailCard = ({ title, data, colorClass, showDetails = true, compact = false, icon }: { title: string, data: any, colorClass: string, showDetails?: boolean, compact?: boolean, icon?: string }) => {
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
    <div className={`bg-surface/50 ${compact ? 'p-3 rounded-2xl' : 'p-5 rounded-[28px]'} border border-surfaceVariant shadow-sm flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className={`flex justify-between items-center ${showDetails && isExpanded ? 'border-b border-surfaceVariant pb-2' : ''}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-dark`}>{data.total}</span>
          {showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <span className="text-[10px]">▼</span>
            </button>
          )}
        </div>
      </div>

      {showDetails && isExpanded && (
        <div className="animate-in slide-in-from-top duration-300 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.own) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
              <span className={`${isMaxHalf(data.own) ? style.accent : 'text-blue-500'} text-[10px]`}>↓</span>
              <div className="flex flex-col">
                <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.own) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>En Campo Propio</span>
                <span className="text-[11px] font-black leading-none text-dark">{data.own}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.rival) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
              <span className={`${isMaxHalf(data.rival) ? style.accent : 'text-orange-500'} text-[10px]`}>↑</span>
              <div className="flex flex-col">
                <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.rival) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>En Campo Rival</span>
                <span className="text-[11px] font-black leading-none text-dark">{data.rival}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.left) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
              <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.left) ? style.text : 'text-onSurfaceVariant opacity-60'}`}>Izquierda</span>
              <span className="text-[10px] font-black text-dark">{data.left}</span>
            </div>
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.center) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
              <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.center) ? style.text : 'text-onSurfaceVariant opacity-60'}`}>Centro</span>
              <span className="text-[10px] font-black text-dark">{data.center}</span>
            </div>
            <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.right) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
              <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.right) ? style.text : 'text-onSurfaceVariant opacity-60'}`}>Derecha</span>
              <span className="text-[10px] font-black text-dark">{data.right}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatComparisonCard = ({ title, icon, homeData, awayData, allEvents, homeColor, awayColor }: { title: string, icon: string, homeData: any, awayData: any, allEvents: GameEvent[], homeColor: string, awayColor: string }) => {
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
    <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
      <div className={`flex justify-between items-center ${isExpanded ? 'border-b border-surfaceVariant pb-3' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs">{icon}</span>
          <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-dark">{homeData.total}/{awayData.total}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <span className="text-[10px]">▼</span>
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 py-1 border-b border-surfaceVariant/30">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: homeColor }}></div>
            <div className="grid grid-cols-4 flex-1 gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Gol:</span>
                <span className="text-[10px] font-black text-dark leading-none">{homeOutcomes.gol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Ata:</span>
                <span className="text-[10px] font-black text-dark leading-none">{homeOutcomes.atajado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Des:</span>
                <span className="text-[10px] font-black text-dark leading-none">{homeOutcomes.desviado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Pér:</span>
                <span className="text-[10px] font-black text-dark leading-none">{homeOutcomes.perdida}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: awayColor }}></div>
            <div className="grid grid-cols-4 flex-1 gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Gol:</span>
                <span className="text-[10px] font-black text-dark leading-none">{awayOutcomes.gol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Ata:</span>
                <span className="text-[10px] font-black text-dark leading-none">{awayOutcomes.atajado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Des:</span>
                <span className="text-[10px] font-black text-dark leading-none">{awayOutcomes.desviado}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Pér:</span>
                <span className="text-[10px] font-black text-dark leading-none">{awayOutcomes.perdida}</span>
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
      <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-tighter opacity-70">{label}</p>
      <div className={`w-full overflow-hidden flex flex-col ${borderPosition === 'top' ? 'flex-col-reverse' : 'flex-col'}`}>
        <div
          className={`w-full h-12 bg-surfaceVariant/5 border border-surfaceVariant flex overflow-hidden ${type === 'zone23'
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
                className={`flex-1 border-r last:border-r-0 border-surfaceVariant/20 flex flex-col items-center justify-center transition-all ${cellRoundedClass} ${active ? 'bg-primary/10' : ''}`}
              >
                <span className={`text-[10px] font-black ${active ? 'text-primary' : 'text-dark/40'}`}>
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

const LiveGameView: React.FC<{
  role: UserRole,
  onExitGame: () => void,
  onAnnulGame: () => void
}> = ({ role, onExitGame, onAnnulGame }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [possession, setPossession] = useState<Possession>(Possession.NONE);
  const [passCount, setPassCount] = useState(0);
  const [foulPlayer, setFoulPlayer] = useState('');
  const [foulMinutes, setFoulMinutes] = useState('');
  const [showPopup, setShowPopup] = useState<{ x: number, y: number, type: 'FOUL' | 'SHOT' | 'CORTO_PENAL', targetGoal?: 'TOP' | 'BOTTOM' } | null>(null);

  // Modal de detalles de gol
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalAuthor, setGoalAuthor] = useState('');
  const [goalType, setGoalType] = useState<'Individual' | 'Colectiva' | 'Penal' | 'Corto' | null>(null);
  const [pendingGoalAction, setPendingGoalAction] = useState<{ scoreUpdate: { home: number, away: number }, nextPoss: Possession } | null>(null);

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
  const [tacticalSchemes, setTacticalSchemes] = useState<TacticalScheme[]>(() => PersistenceManager.loadStateLocal().tacticalSchemes || []);
  const [activeTacticId, setActiveTacticId] = useState<string | null>(null);
  const [expandedTacticId, setExpandedTacticId] = useState<string | null>(null);
  const [showNewTacticForm, setShowNewTacticForm] = useState(false);
  const [newTactic, setNewTactic] = useState({ name: '', description: '', objective: '' });


  // Estados de orientación de la cancha
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [syncQueueLength, setSyncQueueLength] = useState(PersistenceManager.getSyncQueueLength());

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

  const timerRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (id) {
      const activeGame = StorageService.getActiveGame();

      if (activeGame && activeGame.game.id === id) {
        // Resume game fully
        setGame(activeGame.game);
        setSeconds(activeGame.seconds);
        setPeriod(activeGame.period);
        setPossession(activeGame.possession);
        setLocalPossessionTime(activeGame.localPossessionTime);
        setAwayPossessionTime(activeGame.awayPossessionTime);
        setPassCount(activeGame.passCount);
        setIsRunning(activeGame.isRunning);
        if (activeGame.game.activeTacticId) setActiveTacticId(activeGame.game.activeTacticId);
      } else {
        // Load fresh from DB if not active locally
        const data = PersistenceManager.getGame(id);
        if (data) {
          setGame(data);
          if (data.activeTacticId) setActiveTacticId(data.activeTacticId);
        }
      }

      // Cargar tácticas
      const state = PersistenceManager.loadStateLocal();
      setTacticalSchemes(state.tacticalSchemes || []);
    }
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

  useEffect(() => {
    if (game) PersistenceManager.updateGame(game);
  }, [game]);

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
      setFoulPlayer('');
      setFoulMinutes('');
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
          ['Extremo Derecho', 'Centro Derecha', 'Centro', 'Centro Izquierda', 'Extremo Izquierdo'].forEach(sect => {
            if (details.includes(sect.toLowerCase())) {
              if (isHomeEntry) statsArea.home[sect as keyof typeof statsArea.home]++;
              else statsArea.away[sect as keyof typeof statsArea.away]++;
            }
          });
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

  if (!game) return <div className="p-8 text-center text-onSurfaceVariant font-bold">Cargando datos...</div>;

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
    const message = `🏆 ¡Nuevo récord: ${count} pases!`;
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
    }
    registerEvent(type, nextPoss, x, y, details);
  };

  const handleManualMenu = (x: number, y: number) => {
    setShowPopup({ x, y, type: 'FOUL' });
  };

  const registerEvent = (type: string, nextPoss: Possession, x: number, y: number, details?: string, forcedTeamId?: string, scoringTeam?: Possession, audioData?: string) => {
    const eventId = Math.random().toString(36).substr(2, 5);

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
      const eventTeamId = forcedTeamId || ((type.includes('DISPARO') || type.includes('GOL')) ? attackingTeamId : (nextPoss === Possession.HOME ? prev.teamHome.id : prev.teamAway.id));

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
        prevPossession: possession // Store current before applying nextPoss
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
    setTacticalSchemes(updatedTactics);
    PersistenceManager.updateTactics(updatedTactics);

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

  const handleGoalClick = (scoreUpdate: { home: number, away: number }, nextPoss: Possession) => {
    setPendingGoalAction({ scoreUpdate, nextPoss });
    if (foulPlayer) setGoalAuthor(foulPlayer);
    setShowGoalModal(true);
  };

  const confirmGoalDetails = () => {
    if (!pendingGoalAction) return;

    const authorStr = goalAuthor ? `#${goalAuthor}` : 'Jugador: N/A';
    const typeMap = {
      'Individual': 'J. Individual',
      'Colectiva': 'J. Colectiva',
      'Penal': 'Penal',
      'Corto': 'C. Corto'
    };
    const typeStr = goalType ? typeMap[goalType] : 'Tipo: No especificado';

    let eventType = 'DISPARO (GOL)';
    if (lastSecondaryAction) {
      if (lastSecondaryAction.includes('CÓRNER CORTO')) eventType = 'GOL (Córner Corto)';
      else if (lastSecondaryAction.includes('PENAL')) eventType = 'GOL (Penal)';
    }

    const finalDetails = `GOL${foulPlayer ? ` (#${foulPlayer})` : ''} | ${authorStr} | ${typeStr}`;

    updateLastEvent(eventType, finalDetails, pendingGoalAction.scoreUpdate, pendingGoalAction.nextPoss);
    setLastSecondaryAction(null); // Used, now clear it
    resetGoalModal();
  };

  const skipGoalDetails = () => {
    if (!pendingGoalAction) return;

    let eventType = 'DISPARO (GOL)';
    if (lastSecondaryAction) {
      if (lastSecondaryAction.includes('CÓRNER CORTO')) eventType = 'GOL (Córner Corto)';
      else if (lastSecondaryAction.includes('PENAL')) eventType = 'GOL (Penal)';
    }

    updateLastEvent(eventType, 'GOL | Jugador: N/A | Tipo: No especificado', pendingGoalAction.scoreUpdate, pendingGoalAction.nextPoss);
    setLastSecondaryAction(null);
    resetGoalModal();
  };

  const resetGoalModal = () => {
    setShowGoalModal(false);
    setGoalAuthor('');
    setGoalType(null);
    setPendingGoalAction(null);
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
      // Exact match for the main event type or containing it
      const isTarget = types.some(t => {
        const typeUpper = e.type.toUpperCase();
        const tUpper = t.toUpperCase();
        return typeUpper === tUpper || typeUpper.includes(`${tUpper} `) || typeUpper.includes(`(${tUpper})`);
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

  const handleFinishGame = async () => {
    if (window.confirm('¿Estás seguro de finalizar el partido?')) {
      if (id) {
        PersistenceManager.forceSyncGame(id);

        try {
          if (auth.currentUser && game) {
            const userId = auth.currentUser.uid;
            const gameData = { ...game, userId };
            await setDoc(doc(db, 'matches', id), gameData, { merge: true });
            console.log('Partido guardado en Firebase');
          } else {
            console.error('No se pudo guardar: Usuario o partido no válido');
          }
        } catch (error) {
          console.error('Error al guardar el partido en Firebase:', error);
        }
      }
      StorageService.clearActiveGame();
      onExitGame();
      navigate(`/summary/${game.id}`);
    }
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(base64);
    audio.play();
  };

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
          { id: 'ALL', label: 'Todo', icon: '📝' },
          { id: 'DISPARO', label: 'Remate', icon: '🥅' },
          { id: 'FALTA', label: 'Falta', icon: '⚠️' },
          { id: 'PÉRDIDA', label: 'Pérdida', icon: '📉' },
          { id: 'RECUPERO', label: 'Recupero', icon: '📈' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setEventFilter(f.id as ActionFilter)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${eventFilter === f.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface text-onSurfaceVariant/60 border-surfaceVariant hover:border-primary/40'
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
              : 'bg-surface text-onSurfaceVariant/60 border-surfaceVariant hover:border-primary/40'
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
      className="h-screen w-full flex flex-col bg-surface overflow-hidden select-none transition-all duration-500"
      style={{ overscrollBehavior: 'none' }}
    >

      {snackbar.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-brandDark text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-300 border border-primary/20 flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest">{snackbar.message}</span>
        </div>
      )}

      {/* Modal Detalles de Gol */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-brandDark/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white border border-surfaceVariant p-8 rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in duration-300">
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-[4px] mb-6 text-center">Detalles del Gol 🥅</h3>

            {/* Sección Autor */}
            <div className="mb-8">
              <label className="text-[9px] font-black text-dark uppercase tracking-widest mb-3 block">Autor del Gol (Dorsal)</label>
              <input
                type="number"
                maxLength={2}
                autoFocus
                value={goalAuthor}
                onChange={(e) => setGoalAuthor(e.target.value.slice(0, 2))}
                className="w-full h-16 bg-surface border border-surfaceVariant rounded-2xl text-center text-3xl font-black outline-none focus:border-primary transition-colors tabular-nums"
                placeholder="00"
              />
            </div>

            {/* Sección Tipo de Jugada */}
            <div className="mb-10">
              <label className="text-[9px] font-black text-dark uppercase tracking-widest mb-4 block">Tipo de Jugada</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Individual', label: 'Individual', icon: '👤' },
                  { id: 'Colectiva', label: 'Colectiva', icon: '🤝' },
                  { id: 'Penal', label: 'Penal', icon: '🎯' },
                  { id: 'Corto', label: 'C. Corto', icon: '🏑' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setGoalType(type.id as any)}
                    className={`h-16 rounded-2xl border flex items-center justify-center gap-3 text-xs font-black transition-all ${goalType === type.id
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-surface border-surfaceVariant text-onSurfaceVariant'
                      }`}
                  >
                    <span>{type.icon}</span>
                    <span className="uppercase">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmGoalDetails}
                className="w-full bg-primary text-white font-black py-5 rounded-2xl active:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                Confirmar Registro
              </button>
              <button
                onClick={skipGoalDetails}
                className="w-full bg-surface text-red-600 font-black py-4 rounded-2xl active:scale-95 text-[10px] uppercase tracking-widest border border-red-100"
              >
                Omitir info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Período */}
      {periodToConfirm !== null && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-brandDark/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white border border-surfaceVariant p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl mb-6">⏱️</div>
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-[4px] mb-2">Finalizar Tiempo Actual</h3>
            <h2 className="contrail-font text-2xl text-dark uppercase tracking-tighter leading-tight mb-6">
              ¿Deseas finalizar el período actual y comenzar el {periodToConfirm}Q?
            </h2>
            <p className="text-[11px] text-onSurfaceVariant/60 font-bold mb-8 leading-relaxed">
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
                className="w-full bg-surface text-onSurfaceVariant font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Mantener período actual
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-brandDark/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border border-surfaceVariant p-6 rounded-[32px] shadow-2xl">
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4">Nueva Observación</h3>
            <textarea autoFocus className="w-full h-32 bg-surfaceVariant/20 border border-surfaceVariant p-4 rounded-2xl text-onSurface outline-none focus:border-primary transition-colors text-sm" placeholder="Escribe aquí..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveTextNote} className="flex-1 bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase">GUARDAR</button>
              <button onClick={() => setShowNoteModal(false)} className="px-6 bg-surfaceVariant text-onSurfaceVariant font-bold rounded-2xl text-[10px] uppercase">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Acción */}
      {eventToEdit && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-brandDark/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border border-surfaceVariant p-6 rounded-[32px] shadow-2xl">
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-2">Editar Acción</h3>
            <p className="text-[9px] font-black text-primary mb-4 uppercase">{eventToEdit.type} - {eventToEdit.gameTime}</p>
            <textarea
              autoFocus
              className="w-full h-32 bg-surfaceVariant/20 border border-surfaceVariant p-4 rounded-2xl text-onSurface outline-none focus:border-primary transition-colors text-sm"
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
                className="px-6 bg-surfaceVariant text-onSurfaceVariant font-bold rounded-2xl text-[10px] uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Salida (Anular Juego) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-brandDark/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border border-surfaceVariant p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-200 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="contrail-font text-2xl text-dark uppercase mb-2">¿Anular Juego?</h3>
            <p className="text-[11px] font-bold text-onSurfaceVariant uppercase leading-relaxed mb-8">
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
                className="w-full bg-surface text-onSurfaceVariant font-black py-4 rounded-2xl active:scale-95 text-xs uppercase border border-surfaceVariant transition-all"
              >
                CONTINUAR JUGANDO
              </button>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-[400] flex">
          <div className="absolute inset-0 bg-brandDark/20 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <aside className="relative w-72 h-full bg-white border-r border-surfaceVariant shadow-2xl flex flex-col p-8 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-lg font-black text-dark uppercase tracking-[4px]">Menú</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-onSurfaceVariant p-2 hover:bg-surfaceVariant rounded-full transition-colors">✕</button>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
              <button onClick={handleFinishGame} className="w-full text-left p-4 rounded-xl bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 mb-4">Finalizar Match</button>

              <div className="py-2 border-b border-surfaceVariant mb-2">
                <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest mb-3 px-4">Configuración de Vista</p>
                <button
                  onClick={() => setIsLandscape(!isLandscape)}
                  className={`w-full text-left p-4 rounded-xl flex items-center justify-between font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${isLandscape ? 'bg-primary/5 text-primary' : 'hover:bg-surface text-onSurface'}`}
                >
                  <span>Cancha Horizontal (90°)</span>
                  <span>{isLandscape ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full text-left p-4 rounded-xl flex items-center justify-between font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${isFlipped ? 'bg-primary/5 text-primary' : 'hover:bg-surface text-onSurface'}`}
                >
                  <span>Invertir Sentido Ataque</span>
                  <span>{isFlipped ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {["1: Configurar juego", "2: Configurar plantel", "3: Configurar acciones"].map((opt, i) => (
                <button key={i} className="w-full text-left p-4 rounded-xl hover:bg-surface text-onSurface font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95" onClick={() => setIsMenuOpen(false)}>{opt}</button>
              ))}
            </nav>
            <div className="pt-6 mt-6 border-t border-surfaceVariant">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="w-full text-left p-4 bg-red-50 text-red-600 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-red-100 active:scale-95"
              >
                <span>🏠</span> Regresar al dashboard
              </button>
            </div>
          </aside>
        </div>
      )}

      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 border-b border-surfaceVariant shadow-sm z-[200]">
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
              backgroundColor: game.teamHome.primaryColor || '#6d5dfc',
              color: game.teamHome.secondaryColor || '#ffffff'
            }}
          >
            <span className="hidden sm:block text-[10px] md:text-sm font-black uppercase tracking-wider">{game.teamHome.name}</span>
            <span className="text-2xl md:text-4xl font-black leading-none">{game.scoreHome}</span>
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
              backgroundColor: game.teamAway.primaryColor || '#ef4444',
              color: game.teamAway.secondaryColor || '#ffffff'
            }}
          >
            <span className="hidden sm:block text-[10px] md:text-sm font-black uppercase tracking-wider">{game.teamAway.name}</span>
            <span className="text-2xl md:text-4xl font-black leading-none">{game.scoreAway}</span>
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
              <div className="absolute top-full right-0 mt-2 bg-white border border-surfaceVariant shadow-2xl rounded-2xl p-1.5 z-[300] flex flex-col min-w-[60px] animate-in zoom-in duration-150">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => handlePeriodRequest(q)}
                    className={`px-4 py-2.5 text-[10px] font-black rounded-xl transition-colors ${period === q ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-surface'}`}
                  >
                    {q}Q
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-surface px-3 py-1.5 rounded-xl border border-surfaceVariant flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 px-0.5 border-r border-surfaceVariant pr-2">
              <div
                className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ${!navigator.onLine
                    ? 'bg-red-500 animate-pulse'
                    : syncQueueLength > 0
                      ? 'bg-amber-400 animate-bounce'
                      : 'bg-emerald-500 shadow-emerald-500/50'
                  }`}
                title={!navigator.onLine ? 'Desconectado' : syncQueueLength > 0 ? 'Sincronizando...' : 'Sincronizado'}
              />
              <span className="text-[6px] font-black text-onSurfaceVariant/40 uppercase tracking-tighter leading-none">
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

      <main className="flex-1 flex overflow-hidden bg-surface">
        {!isLandscape && (
          <aside className="hidden lg:flex w-[320px] flex-col p-5 bg-white border-r border-surfaceVariant overflow-y-auto no-scrollbar">
            <div className="flex flex-col gap-6 pb-10">
              <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest border-b border-surfaceVariant pb-2 italic">Análisis en Tiempo Real</h3>

              <EntryAnalysisCard
                title="Ingresos al Área"
                icon="📥"
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
                icon="2️⃣3️⃣"
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
                icon="🏑"
                homeData={getDetailedStat(['CÓRNER CORTO'], game.teamHome.id)}
                awayData={getDetailedStat(['CÓRNER CORTO'], game.teamAway.id)}
                allEvents={game.events}
                homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                awayColor={game.teamAway.primaryColor || '#ef4444'}
              />
              <StatComparisonCard
                title="Penales"
                icon="🎯"
                homeData={getDetailedStat(['PENAL'], game.teamHome.id)}
                awayData={getDetailedStat(['PENAL'], game.teamAway.id)}
                allEvents={game.events}
                homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                awayColor={game.teamAway.primaryColor || '#ef4444'}
              />

              {/* Remates Totales Sidebar - MOVED FROM RIGHT */}
              <div className="bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant shadow-sm flex flex-col gap-3">
                <div className={`flex justify-between items-center ${shotsTotalSidebarExpanded ? 'border-b border-surfaceVariant pb-2' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🥅</span>
                    <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest leading-none">Remates Totales</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-dark">{landscapeShots.home}/{landscapeShots.away}</span>
                    <button
                      onClick={() => setShotsTotalSidebarExpanded(!shotsTotalSidebarExpanded)}
                      className={`w-5 h-5 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${shotsTotalSidebarExpanded ? 'rotate-180' : ''}`}
                    >
                      <span className="text-[8px]">▼</span>
                    </button>
                  </div>
                </div>

                {shotsTotalSidebarExpanded && (
                  <div className="flex flex-col gap-3 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 py-1 border-b border-surfaceVariant/30">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                      <div className="grid grid-cols-3 flex-1 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Gol:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['GOL'], game.teamHome.id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Ata:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['ATAJADO'], game.teamHome.id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Des:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['DESVIADO'], game.teamHome.id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                      <div className="grid grid-cols-3 flex-1 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Gol:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['GOL'], game.teamAway.id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Ata:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['ATAJADO'], game.teamAway.id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black text-onSurfaceVariant uppercase">Des:</span>
                          <span className="text-[10px] font-black text-dark leading-none">{getStat(['DESVIADO'], game.teamAway.id)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        <div className={`flex-1 relative ${isLandscape ? 'p-0' : 'p-2'} flex gap-0 overflow-hidden`}>
          {isLandscape && (
            <aside className="w-[80px] bg-white border-r border-surfaceVariant flex flex-col items-center py-4 gap-6 z-50 shadow-lg shrink-0">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">🥅</span>
                <span className="text-[12px] font-black">{landscapeShots.home}/{landscapeShots.away}</span>
                <span className="text-[8px] font-bold text-onSurfaceVariant uppercase tracking-tighter">Tiros</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">⚠️</span>
                <span className="text-[12px] font-black">{landscapeFouls.home}/{landscapeFouls.away}</span>
                <span className="text-[8px] font-bold text-onSurfaceVariant uppercase tracking-tighter">Faltas</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">📉</span>
                <span className="text-[12px] font-black">{turnoversHome}</span>
                <span className="text-[8px] font-bold text-onSurfaceVariant uppercase tracking-tighter">Pérd.</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">📈</span>
                <span className="text-[12px] font-black">{stealsHome}</span>
                <span className="text-[8px] font-bold text-onSurfaceVariant uppercase tracking-tighter">Recup.</span>
              </div>
            </aside>
          )}

          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-surfaceVariant/10">
            <div className={`relative ${isLandscape ? 'w-[92%] h-[92%]' : 'w-full h-full'}`}>
              {activeView === 'tactics' ? (
                <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-dark uppercase tracking-widest">Administrador de Tácticas</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowNewTacticForm(!showNewTacticForm)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-1 ${showNewTacticForm ? 'bg-surface text-onSurfaceVariant' : 'bg-primary text-white shadow-md hover:scale-105'}`}
                      >
                        {showNewTacticForm ? 'Cancelar' : <><span className="text-lg leading-none">+</span> Crear Nueva Táctica</>}
                      </button>
                      <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">Cerrar</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-4 pr-2">
                    {showNewTacticForm && (
                      <div className="border border-primary/30 bg-primary/5 rounded-[28px] p-5 mb-4 animate-in slide-in-from-top duration-300 shadow-inner">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest italic border-b border-primary/20 pb-2 mb-4">Nueva Formación</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-1 md:col-span-2">
                            <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1">Nombre de la Táctica</label>
                            <input
                              type="text"
                              value={newTactic.name}
                              onChange={e => setNewTactic({ ...newTactic, name: e.target.value })}
                              className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary shadow-sm"
                              placeholder="Ej: Presión Alta 3-1"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1">Objetivo Esperado</label>
                            <input
                              type="text"
                              value={newTactic.objective}
                              onChange={e => setNewTactic({ ...newTactic, objective: e.target.value })}
                              className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary shadow-sm"
                              placeholder="Ej: Recuperar en 23 yardas"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1">Descripción (Opcional)</label>
                            <input
                              type="text"
                              value={newTactic.description}
                              onChange={e => setNewTactic({ ...newTactic, description: e.target.value })}
                              className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary shadow-sm"
                              placeholder="Detalles del movimiento..."
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 mt-2 flex gap-3">
                            <button
                              onClick={() => handleAddTactic(false)}
                              disabled={!newTactic.name}
                              className="flex-1 bg-surfaceVariant/20 text-onSurfaceVariant font-black py-3.5 rounded-xl active:scale-95 text-[10px] uppercase tracking-widest border border-surfaceVariant transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              GUARDAR
                            </button>
                            <button
                              onClick={() => handleAddTactic(true)}
                              disabled={!newTactic.name}
                              className="flex-[2] bg-primary text-white font-black py-3.5 rounded-xl active:scale-95 text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              GUARDAR Y ACTIVAR TÁCTICA
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {tacticalSchemes.map((t) => {
                      const isActive = activeTacticId === t.id;
                      const isExpanded = expandedTacticId === t.id;

                      // Calibrar estadísticas para esta táctica
                      const tacticEvents = game.events.filter(e => e.tacticId === t.id);
                      const ingresosPropios = tacticEvents.filter(e => e.type.toLowerCase().includes('ingreso') && !e.type.toLowerCase().includes('rival')).length;
                      const ingresosRivales = tacticEvents.filter(e => e.type.toLowerCase().includes('ingreso rival')).length;
                      const recuperos = tacticEvents.filter(e => e.type.toLowerCase().includes('recupero')).length;

                      return (
                        <div
                          key={t.id}
                          className={`border-2 rounded-[28px] transition-all duration-300 overflow-hidden ${isActive ? 'border-[#00fe00] bg-[#00fe00]/5 shadow-lg shadow-[#00fe00]/10' : 'border-surfaceVariant bg-surface/30'
                            }`}
                        >
                          <div className={`p-5 flex items-center justify-between border-b border-surfaceVariant/5 ${isActive ? 'bg-[#00fe00]/2' : ''}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-dark' : 'text-onSurfaceVariant'}`}>{t.name}</h4>
                                {isActive && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#00fe00] rounded-full animate-pulse shadow-[0_0_4px_#00fe00]"></span>
                                    <span className="text-[7px] font-black text-[#00c000] uppercase tracking-widest">Activa</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[9px] font-bold text-onSurfaceVariant/60 italic leading-tight">{t.objective}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => setExpandedTacticId(isExpanded ? null : t.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-surfaceVariant/20 ${isExpanded ? 'rotate-180 text-primary' : 'text-onSurfaceVariant/40'}`}
                              >
                                🔽
                              </button>

                              {/* Switch de Actividad */}
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (isActive) {
                                      setActiveTacticId(null);
                                    } else {
                                      setActiveTacticId(t.id);
                                      setActiveView('field');
                                    }
                                  }}
                                  className={`relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner border ${isActive 
                                    ? 'bg-[#00fe00] border-[#00e000] shadow-[#00fe00]/20' 
                                    : 'bg-surfaceVariant/30 border-surfaceVariant'
                                  }`}
                                >
                                  <div className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-all duration-300 transform ${isActive ? 'left-[calc(100%-20px)] rotate-0' : 'left-0.5'}`} />
                                </button>
                                <span className={`text-[6px] font-black uppercase tracking-tighter ${isActive ? 'text-[#00c000]' : 'text-onSurfaceVariant/40'}`}>
                                  {isActive ? 'ON' : 'OFF'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-5 pb-5 pt-2 border-t border-surfaceVariant/10 grid grid-cols-3 gap-3 animate-in slide-in-from-top duration-300">
                              <div className="bg-white/40 p-3 rounded-2xl border border-surfaceVariant/30 flex flex-col items-center">
                                <span className="text-[7px] font-black uppercase text-onSurfaceVariant mb-1">Ing. Propios</span>
                                <span className="text-sm font-black text-dark">{ingresosPropios}</span>
                              </div>
                              <div className="bg-white/40 p-3 rounded-2xl border border-surfaceVariant/30 flex flex-col items-center">
                                <span className="text-[7px] font-black uppercase text-onSurfaceVariant mb-1">Ing. Rivales</span>
                                <span className="text-sm font-black text-dark">{ingresosRivales}</span>
                              </div>
                              <div className="bg-white/40 p-3 rounded-2xl border border-surfaceVariant/30 flex flex-col items-center">
                                <span className="text-[7px] font-black uppercase text-onSurfaceVariant mb-1">Recuperos</span>
                                <span className="text-sm font-black text-dark">{recuperos}</span>
                              </div>
                              <div className="col-span-3 mt-1">
                                <p className="text-[8px] font-bold text-onSurfaceVariant/50 leading-relaxed uppercase">{t.description}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {tacticalSchemes.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                        <div className="mb-4 scale-150">
                          <TacticIcon active={false} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[3px]">Sin tácticas configuradas</p>
                        <p className="text-[9px] font-bold mt-2">Configura tus formaciones en el Dashboard</p>
                      </div>
                    )}

                  </div>
                </div>

              ) : activeView === 'list' ? (
                <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-dark uppercase tracking-widest">Listado de Acciones</h3>
                    <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                  </div>
                  <FilterChips />
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-4">
                    {filteredEvents.map((e) => (
                      <div key={e.id} className="bg-surface/60 border border-surfaceVariant p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-primary font-black text-xs bg-primary/10 px-2 py-1 rounded shrink-0">{e.gameTime}</span>
                            <div className="flex items-center gap-2">
                              {(e.type.includes('DISPARO') || e.type.includes('GOL') || e.type.includes('FALTA')) && (
                                <span
                                  className="text-[10px] font-black px-2 py-0.5 rounded border border-current shrink-0 min-w-[24px] text-center"
                                  style={{
                                    color: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                    borderColor: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                    backgroundColor: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? `${game.teamHome.primaryColor || '#6d5dfc'}11` : `${game.teamAway.primaryColor || '#ef4444'}11`
                                  }}
                                >
                                  {((e.teamId === game.teamHome.id && !e.type.includes('GOL')) || (e.scoringTeam === Possession.HOME)) ? 'L' : 'V'}
                                </span>
                              )}
                              <p className="text-dark text-sm font-bold uppercase">{e.type}</p>
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
                        ) : e.transcription ? (
                          <p className="text-xs text-dark italic bg-primary/5 p-3 rounded-xl border border-primary/10">{e.transcription}</p>
                        ) : (
                          <p className="text-[10px] text-onSurfaceVariant uppercase font-black">{e.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeView === 'stats' ? (
                <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-dark uppercase tracking-widest">Estadísticas Detalladas</h3>
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
                            : 'bg-surface text-onSurfaceVariant/60 border-surfaceVariant hover:border-primary/40'
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="bg-surface/50 p-6 rounded-[24px] border border-surfaceVariant mb-6 shadow-inner flex flex-col gap-4">
                      <div className={`flex justify-between items-center ${possessionExpanded ? 'border-b border-surfaceVariant pb-3' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">⏱️</span>
                          <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Posesión</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-dark">{localPct}% / {awayPct}%</span>
                          <button
                            onClick={() => setPossessionExpanded(!possessionExpanded)}
                            className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${possessionExpanded ? 'rotate-180' : ''}`}
                          >
                            <span className="text-[10px]">▼</span>
                          </button>
                        </div>
                      </div>

                      {possessionExpanded && (
                        <div className="animate-in slide-in-from-top duration-300">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                              <span className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Posesión Local</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Posesión Visita</span>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                            </div>
                          </div>
                          <div className="w-full h-10 bg-surfaceVariant/20 rounded-2xl overflow-hidden flex shadow-inner border border-surfaceVariant/50">
                            <div
                              className="h-full transition-all duration-700 ease-out flex items-center justify-center text-[11px] font-black text-white drop-shadow-sm"
                              style={{ width: `${localPct}%`, backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}
                            >
                              {localPct > 15 && `${localPct}%`}
                            </div>
                            <div
                              className="h-full transition-all duration-700 ease-out flex items-center justify-center text-[11px] font-black text-white drop-shadow-sm"
                              style={{ width: `${awayPct}%`, backgroundColor: game.teamAway.primaryColor || '#ef4444' }}
                            >
                              {awayPct > 15 && `${awayPct}%`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Remates Propios */}
                      <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
                        <div className={`flex justify-between items-center ${shotsOwnExpanded ? 'border-b border-surfaceVariant pb-3' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🥅</span>
                            <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Remates Propios</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-primary">{getStat(['DISPARO'])}</span>
                            <button
                              onClick={() => setShotsOwnExpanded(!shotsOwnExpanded)}
                              className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${shotsOwnExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="text-[10px]">▼</span>
                            </button>
                          </div>
                        </div>
                        {shotsOwnExpanded && (
                          <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top duration-300">
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-primary uppercase mb-1">Goles</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['GOL'])}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-onSurfaceVariant uppercase mb-1">Atajados</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['ATAJADO'])}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-onSurfaceVariant uppercase mb-1">Desviados</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['DESVIADO'])}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remates Rival */}
                      <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
                        <div className={`flex justify-between items-center ${shotsRivalExpanded ? 'border-b border-surfaceVariant pb-3' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🥅</span>
                            <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Remates Rival</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-orange-600">{getStat(['DISPARO'], game.teamAway.id)}</span>
                            <button
                              onClick={() => setShotsRivalExpanded(!shotsRivalExpanded)}
                              className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${shotsRivalExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="text-[10px]">▼</span>
                            </button>
                          </div>
                        </div>
                        {shotsRivalExpanded && (
                          <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top duration-300">
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-orange-600 uppercase mb-1">Goles</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['GOL'], game.teamAway.id)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-onSurfaceVariant uppercase mb-1">Atajados</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['ATAJADO'], game.teamAway.id)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] font-black text-onSurfaceVariant uppercase mb-1">Desviados</span>
                              <span className="text-[11px] font-black text-dark">{getStat(['DESVIADO'], game.teamAway.id)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remates Totales Summary Card */}
                      <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
                        <div className={`flex justify-between items-center ${shotsTotalSidebarExpanded ? 'border-b border-surfaceVariant pb-3' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🥅</span>
                            <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Remates Totales</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-dark">{landscapeShots.home}/{landscapeShots.away}</span>
                            <button
                              onClick={() => setShotsTotalSidebarExpanded(!shotsTotalSidebarExpanded)}
                              className={`w-6 h-6 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${shotsTotalSidebarExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="text-[10px]">▼</span>
                            </button>
                          </div>
                        </div>
                        {shotsTotalSidebarExpanded && (
                          <div className="flex flex-col gap-4 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between py-1 border-b border-surfaceVariant/30">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                                <span className="text-[9px] font-black text-onSurfaceVariant uppercase">Local</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-[10px] font-black text-dark">G: {getStat(['GOL'], game.teamHome.id)}</span>
                                <span className="text-[10px] font-black text-dark">A: {getStat(['ATAJADO'], game.teamHome.id)}</span>
                                <span className="text-[10px] font-black text-dark">D: {getStat(['DESVIADO'], game.teamHome.id)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                                <span className="text-[9px] font-black text-onSurfaceVariant uppercase">Visita</span>
                              </div>
                              <div className="flex gap-4">
                                <span className="text-[10px] font-black text-dark">G: {getStat(['GOL'], game.teamAway.id)}</span>
                                <span className="text-[10px] font-black text-dark">A: {getStat(['ATAJADO'], game.teamAway.id)}</span>
                                <span className="text-[10px] font-black text-dark">D: {getStat(['DESVIADO'], game.teamAway.id)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <StatDetailCard title="Pérdidas 📉" data={getDetailedStat(['PÉRDIDA'])} colorClass="text-orange-600" />
                      <StatDetailCard title="Recuperos 📈" data={getDetailedStat(['RECUPERO'])} colorClass="text-emerald-600" />
                      <StatDetailCard title="Faltas ⚠️" data={getDetailedStat(['FALTA'])} colorClass="text-red-600" />
                      <StatDetailCard title="Remates 🥅" data={getDetailedStat(['DISPARO'])} colorClass="text-slate-700" />

                      {/* Ingresos al Área */}
                      <EntryAnalysisCard
                        title="Ingresos al Área"
                        icon="🎯"
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
                        icon="2️⃣3️⃣"
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
                        icon="🏑"
                        homeData={getDetailedStat(['CÓRNER CORTO'], game.teamHome.id)}
                        awayData={getDetailedStat(['CÓRNER CORTO'], game.teamAway.id)}
                        allEvents={game.events}
                        homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                        awayColor={game.teamAway.primaryColor || '#ef4444'}
                      />
                      <StatComparisonCard
                        title="Penales"
                        icon="🎯"
                        homeData={getDetailedStat(['PENAL'], game.teamHome.id)}
                        awayData={getDetailedStat(['PENAL'], game.teamAway.id)}
                        allEvents={game.events}
                        homeColor={game.teamHome.primaryColor || '#6d5dfc'}
                        awayColor={game.teamAway.primaryColor || '#ef4444'}
                      />
                    </div>

                    <div className="mt-8 mb-6">
                      <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 border-b border-surfaceVariant pb-2 italic">Análisis de Pases</h3>

                      <div className="flex flex-row items-stretch gap-3">
                        <div className="flex-1 bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant text-center shadow-inner flex flex-col justify-center min-h-[100px]">
                          <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-1">Mínimo</p>
                          <p className="text-2xl font-black text-dark leading-none">{pMin}</p>
                          {minPassEvent && (
                            <p className="text-[7px] font-bold text-onSurfaceVariant/50 uppercase mt-1 leading-tight">
                              {minPassEvent.gameTime}
                            </p>
                          )}
                        </div>

                        <div className="flex-[1.2] bg-primary p-4 rounded-[28px] shadow-xl shadow-primary/20 text-center flex flex-col justify-center border-2 border-white/20 min-h-[110px]">
                          <p className="text-[9px] font-black text-white/70 uppercase mb-1">Promedio</p>
                          <p className="text-4xl font-black text-white leading-none">{pAvg}</p>
                          <p className="text-[7px] font-bold text-white/40 uppercase mt-1 tracking-widest">Pases / Cadena</p>
                        </div>

                        <div className="flex-1 bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant text-center shadow-inner flex flex-col justify-center min-h-[100px]">
                          <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-1">Máximo</p>
                          <p className="text-2xl font-black text-dark leading-none">{pMax}</p>
                          {maxPassEvent && (
                            <p className="text-[7px] font-bold text-onSurfaceVariant/50 uppercase mt-1 leading-tight">
                              {maxPassEvent.gameTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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

                  {showPopup && (
                    <div
                      className={`absolute z-[300] bg-white shadow-2xl rounded-[32px] p-6 flex flex-col gap-3 min-w-[200px] border border-surfaceVariant animate-in zoom-in duration-150`}
                      style={{
                        left: `${showPopup.x}%`,
                        top: showPopup.y < 35 ? `${showPopup.y + 10}%` : `${showPopup.y}%`,
                        transform: `${showPopup.y < 35 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'} ${isLandscape ? 'rotate(-90deg)' : ''} ${isFlipped ? 'rotate(-180deg)' : ''}`.trim()
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest border-b border-surfaceVariant pb-2 mb-1">Resultado de Acción</p>
                      {showPopup.type === 'FOUL' ? (
                        <div className="flex flex-col gap-3">
                          {foulCardType === 'AMARILLA' ? (
                            <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                              <div className="flex flex-col gap-2">
                                <label className="text-[8px] font-bold text-onSurfaceVariant uppercase">Jugador #</label>
                                <input
                                  type="text"
                                  value={foulPlayer}
                                  onChange={(e) => setFoulPlayer(e.target.value)}
                                  className="w-full bg-surface border border-surfaceVariant rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                                  placeholder="Ej: 8"
                                />
                              </div>
                              <div className="flex flex-col gap-2 bg-yellow-50/50 p-2 rounded-xl border border-yellow-100">
                                <label className="text-[7px] font-black text-yellow-700 uppercase">Minutos Sanción (Amarilla)</label>
                                <input
                                  type="text"
                                  value={foulMinutes}
                                  onChange={(e) => setFoulMinutes(e.target.value)}
                                  className="w-full bg-white border border-yellow-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-yellow-400"
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
                                className="text-[8px] font-black text-onSurfaceVariant uppercase text-center py-1 hover:text-primary transition-colors"
                                onClick={() => setFoulCardType('NONE')}
                              >
                                Atrás
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-2">
                                <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5 hover:bg-green-50 transition-colors" onClick={() => updateLastEvent('FALTA (VERDE)', 'VERDE')}>
                                  <span className="w-5 h-7 bg-green-500 rounded-sm shadow-sm"></span>
                                  <span>VERDE</span>
                                </button>
                                <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5 hover:bg-yellow-50 transition-colors" onClick={() => setFoulCardType('AMARILLA')}>
                                  <span className="w-5 h-7 bg-yellow-400 rounded-sm shadow-sm"></span>
                                  <span>AMARILLA</span>
                                </button>
                                <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5 hover:bg-red-50 transition-colors" onClick={() => updateLastEvent('FALTA (ROJA)', 'ROJA')}>
                                  <span className="w-5 h-7 bg-red-600 rounded-sm shadow-sm"></span>
                                  <span>ROJA</span>
                                </button>
                                <button 
                                  className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5 hover:bg-surfaceVariant/20 transition-colors" 
                                  onClick={() => updateLastEvent('FALTA COMETIDA', 'Sin tarjeta')}
                                >
                                  <div className="w-5 h-7 border-2 border-dashed border-onSurfaceVariant/30 rounded-sm flex items-center justify-center">
                                    <span className="text-[8px] text-onSurfaceVariant/40">✕</span>
                                  </div>
                                  <span>SIN TARJETA</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : showPopup.type === 'CORTO_PENAL' ? (
                        <div className="flex flex-col gap-2">
                          <button className="text-[10px] font-black text-indigo-600 py-3 rounded-xl bg-indigo-50 border border-indigo-100 uppercase flex items-center justify-center gap-2" onClick={() => registerEvent('CÓRNER CORTO', possession, showPopup.x, showPopup.y, "Córner Corto a Favor")}>🏑 C. CORTO</button>
                          <button className="text-[10px] font-black text-purple-600 py-3 rounded-xl bg-purple-50 border border-purple-100 uppercase flex items-center justify-center gap-2" onClick={() => registerEvent('PENAL', possession, showPopup.x, showPopup.y, "Penal a Favor")}>🎯 PENAL</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-[9px] font-black text-dark uppercase mb-1">Detalles del Remate</p>
                          <div className="flex flex-col gap-2 mb-1">
                            <label className="text-[8px] font-bold text-onSurfaceVariant uppercase">Jugador #</label>
                            <input
                              type="text"
                              value={foulPlayer}
                              onChange={(e) => setFoulPlayer(e.target.value)}
                              className="w-full bg-surface border border-surfaceVariant rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                              placeholder="Ej: 8"
                            />
                          </div>
                          {!atajadoSelected ? (
                            <div className="flex flex-col gap-2">
                              <button className="text-xs font-black text-primary text-left py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4 uppercase" onClick={() => handleGoalClick(showPopup.targetGoal === 'TOP' ? { home: 1, away: 0 } : { home: 0, away: 1 }, showPopup.targetGoal === 'TOP' ? Possession.AWAY : Possession.HOME)}>🥅 GOL</button>
                              <button className="text-xs font-black text-dark text-left py-4 px-5 rounded-xl bg-surface border border-surfaceVariant flex items-center gap-4 uppercase" onClick={() => setAtajadoSelected(true)}>🛡️ ATAJADO</button>
                              <button className="text-xs font-black text-onSurfaceVariant text-left py-4 px-5 rounded-xl bg-surface border border-surfaceVariant flex items-center gap-4 uppercase" onClick={() => updateLastEvent('DISPARO (DESVIADO)', `DESVIADO${foulPlayer ? ` - Jugador #${foulPlayer}` : ''}`, undefined, possession === Possession.HOME ? Possession.AWAY : Possession.HOME)}>💨 DESVIADO</button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 animate-in slide-in-from-right duration-200">
                              <p className="text-[9px] font-black text-dark uppercase mb-1">¿Qué sucede con la posesión?</p>
                              <button className="text-xs font-black text-green-600 text-left py-4 px-5 rounded-xl bg-green-50 border border-green-100 flex items-center gap-4 uppercase" onClick={() => updateLastEvent('DISPARO (ATAJADO)', `ATAJADO${foulPlayer ? ` (#${foulPlayer})` : ''} | Mantiene posesión`, undefined, possession)}>📈 MANTIENE</button>
                              <button className="text-xs font-black text-red-600 text-left py-4 px-5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-4 uppercase" onClick={() => updateLastEvent('DISPARO (ATAJADO)', `ATAJADO${foulPlayer ? ` (#${foulPlayer})` : ''} | Pierde posesión`, undefined, possession === Possession.HOME ? Possession.AWAY : Possession.HOME)}>📉 PIERDE</button>
                              <button className="text-[8px] font-black text-onSurfaceVariant uppercase mt-1 text-center py-1 hover:text-primary transition-colors" onClick={() => setAtajadoSelected(false)}>ATRÁS</button>
                            </div>
                          )}
                        </div>
                      )}

                      <button className="text-[8px] font-black text-onSurfaceVariant uppercase mt-1 text-center py-1 hover:text-primary transition-colors" onClick={() => { setShowPopup(null); setFoulCardType('NONE'); }}>Cerrar</button>
                    </div>
                  )}

                  {!isRunning && possession === Possession.NONE && seconds === 0 && (
                    <div className="absolute inset-0 bg-brandDark/40 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 z-50">
                      <div
                        className="bg-white p-8 rounded-[40px] shadow-2xl border border-surfaceVariant max-w-xs transform animate-bounce-short"
                        style={{ transform: `${isLandscape ? 'rotate(-90deg)' : ''} ${isFlipped ? 'rotate(-180deg)' : ''}`.trim() }}
                      >
                        <div className="text-4xl mb-4">🏑</div>
                        <h3 className="contrail-font text-2xl text-dark uppercase mb-2">¡Casi Listos!</h3>
                        <p className="text-[11px] font-bold text-onSurfaceVariant uppercase leading-relaxed">Selecciona qué equipo inicia con la posesión haciendo click en su marcador arriba.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {isLandscape && (
            <aside className="w-[80px] bg-white border-l border-surfaceVariant flex flex-col items-center py-6 gap-6 z-50 shadow-lg shrink-0">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase tracking-widest leading-none mb-2">Notas</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleVoiceNote(); }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md border-2 ${isRecording ? 'bg-red-600 text-white animate-pulse border-red-400' : 'bg-white border-primary text-primary'}`}
              >
                {isRecording ? '⏺' : '🎤'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowNoteModal(true); }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white text-primary border-2 border-primary active:scale-90 shadow-md text-xl"
              >
                📝
              </button>
            </aside>
          )}
        </div>

        {
          !isLandscape && (
            <aside className="hidden lg:flex w-[320px] flex-col p-4 bg-white border-l border-surfaceVariant overflow-y-auto no-scrollbar">
              <div className="flex flex-col gap-4 pb-10">
                <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest border-b border-surfaceVariant pb-2 italic">Estadísticas En vivo</h3>

                {/* Posesión Sidebar */}
                <div className="bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant shadow-inner flex flex-col gap-2">
                  <div className={`flex justify-between items-center ${possessionSidebarExpanded ? 'border-b border-surfaceVariant/50 pb-2 mb-1' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]">⏱️</span>
                      <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest leading-none">Posesión</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-dark">{localPct}% / {awayPct}%</span>
                      <button
                        onClick={() => setPossessionSidebarExpanded(!possessionSidebarExpanded)}
                        className={`w-5 h-5 flex items-center justify-center rounded-full bg-surfaceVariant/10 transition-transform duration-300 ${possessionSidebarExpanded ? 'rotate-180' : ''}`}
                      >
                        <span className="text-[8px]">▼</span>
                      </button>
                    </div>
                  </div>

                  {possessionSidebarExpanded && (
                    <div className="animate-in slide-in-from-top duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black text-onSurfaceVariant uppercase tracking-widest flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                          {localPct}%
                        </span>
                        <span className="text-[8px] font-black text-onSurfaceVariant uppercase tracking-widest flex items-center gap-1.5">
                          {awayPct}%
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                        </span>
                      </div>
                      <div className="w-full h-4 bg-surfaceVariant/20 rounded-full overflow-hidden flex border border-surfaceVariant/50">
                        <div className="h-full transition-all duration-700" style={{ width: `${localPct}%`, backgroundColor: game.teamHome.primaryColor || '#6d5dfc' }}></div>
                        <div className="h-full transition-all duration-700" style={{ width: `${awayPct}%`, backgroundColor: game.teamAway.primaryColor || '#ef4444' }}></div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Desgloses Detallados Sidebar */}
                <StatDetailCard title="Pérdidas" data={getDetailedStat(['PÉRDIDA'])} colorClass="text-orange-600" compact={true} icon="📉" />
                <StatDetailCard title="Recuperos" data={getDetailedStat(['RECUPERO'])} colorClass="text-emerald-600" compact={true} icon="📈" />
                <StatDetailCard title="Faltas" data={getDetailedStat(['FALTA'])} colorClass="text-red-600" compact={true} icon="⚠️" />

                {/* Análisis de Pases Sidebar Horizontal */}
                <div className="mt-2">
                  <h3 className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest mb-3 italic">Análisis de Pases</h3>
                  <div className="flex flex-row items-stretch gap-2 h-24">
                    <div className="flex-1 bg-surface/50 p-2 rounded-2xl border border-surfaceVariant text-center shadow-inner flex flex-col justify-center">
                      <p className="text-[7px] font-black text-onSurfaceVariant uppercase mb-0.5">Mín</p>
                      <p className="text-lg font-black text-dark leading-none">{pMin}</p>
                      {minPassEvent && <p className="text-[6px] font-bold text-onSurfaceVariant/40 mt-0.5 leading-none">{minPassEvent.gameTime}</p>}
                    </div>
                    <div className="flex-[1.2] bg-primary p-2 rounded-[20px] shadow-lg shadow-primary/10 text-center flex flex-col justify-center border border-white/10">
                      <p className="text-[8px] font-black text-white/60 uppercase mb-0.5">Prom</p>
                      <p className="text-2xl font-black text-white leading-none">{pAvg}</p>
                    </div>
                    <div className="flex-1 bg-surface/50 p-2 rounded-2xl border border-surfaceVariant text-center shadow-inner flex flex-col justify-center">
                      <p className="text-[7px] font-black text-onSurfaceVariant uppercase mb-0.5">Máx</p>
                      <p className="text-lg font-black text-dark leading-none">{pMax}</p>
                      {maxPassEvent && <p className="text-[6px] font-bold text-onSurfaceVariant/40 mt-0.5 leading-none">{maxPassEvent.gameTime}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )
        }
      </main >

      <footer className="h-20 md:h-24 bg-white flex flex-wrap items-center justify-between px-4 md:px-10 shrink-0 border-t border-surfaceVariant shadow-lg relative z-[200] gap-2">
        <div className="relative">
          <button className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-red-50 text-red-600 text-xl flex items-center justify-center border border-red-100 active:scale-90 shadow-sm" onClick={() => setUndoModal(true)}>↩</button>
          {undoModal && (
            <div className="absolute bottom-16 left-0 bg-white border border-surfaceVariant p-5 rounded-[28px] shadow-2xl w-52 animate-in slide-in-from-bottom duration-200 z-[200]">
              <p className="text-[9px] text-onSurfaceVariant font-black uppercase mb-4 text-center">¿Deshacer?</p>
              <div className="flex gap-2.5">
                <button onClick={() => { if (game.events.length > 0) deleteEvent(game.events[game.events.length - 1].id); setUndoModal(false); }} className="flex-1 bg-red-600 text-white text-[9px] font-black py-3 rounded-xl uppercase">BORRAR</button>
                <button onClick={() => setUndoModal(false)} className="flex-1 bg-surfaceVariant text-onSurfaceVariant text-[9px] font-black py-3 rounded-xl uppercase">NO</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-around md:justify-center md:gap-16">
          <div className="flex items-center gap-4 md:gap-8">
            <button className={`text-2xl transition-all ${activeView === 'list' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'list' ? 'field' : 'list')}>📋</button>
            <div className="relative">
              <button 
                onClick={() => setActiveView(activeView === 'tactics' ? 'field' : 'tactics')}
                className="relative group p-2 rounded-full transition-all active:scale-90"
              >
                <TacticIcon active={activeView === 'tactics' || !!activeTacticId} animated={!!activeTacticId} />
                {activeTacticId && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00fe00] rounded-full border-2 border-white shadow-[0_0_4px_#00fe00]"></span>
                )}
              </button>
            </div>
            <button className={`text-2xl transition-all ${activeView === 'stats' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'} ${!isLandscape ? 'lg:hidden' : ''}`} onClick={() => setActiveView(activeView === 'stats' ? 'field' : 'stats')}>📊</button>
          </div>




          {!isLandscape && (
            <div className="flex items-center gap-4 md:gap-8">
              <button
                disabled
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm border bg-surface border-surfaceVariant text-onSurfaceVariant/20 grayscale cursor-not-allowed opacity-50"
              >
                🎤
              </button>
              <button onClick={() => setShowNoteModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center bg-surface text-onSurfaceVariant/40 border border-surfaceVariant active:scale-90 shadow-sm text-xl">📝</button>
            </div>
          )}
        </div>

        <button
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl font-black shadow-xl relative transition-all active:scale-95 border-2 ${possession === Possession.HOME ? 'bg-primary text-white border-primary translate-y-[-4px]' : 'bg-surface text-onSurfaceVariant/20 border-surfaceVariant'}`}
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
      </footer>
    </div >
  );
};

export default LiveGameView;
