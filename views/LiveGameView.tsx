
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole, Game, GameEvent, Possession } from '../types';
import { dbService } from '../services/dbService';

const NSeparator = () => (
  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <path 
        d="M20,130 L20,30 C20,20 30,15 35,20 L75,85 L75,25 L55,25 L80,0 L105,25 L85,25 L85,120 C85,130 75,135 70,130 L30,65 L30,125 L45,125 L25,150 L5,125 L20,125 Z" 
        fill="#6d5dfc" 
        stroke="#131041" 
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

type ActionFilter = 'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO';
type PeriodFilter = 'ALL' | 1 | 2 | 3 | 4;

const LiveGameView: React.FC<{ role: UserRole }> = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [possession, setPossession] = useState<Possession>(Possession.NONE);
  const [passCount, setPassCount] = useState(0);
  const [showPopup, setShowPopup] = useState<{ x: number, y: number, type: 'FOUL' | 'SHOT', targetGoal?: 'TOP' | 'BOTTOM' } | null>(null);
  const [activeView, setActiveView] = useState<'field' | 'list' | 'heatmap' | 'stats'>('field');
  const [eventFilter, setEventFilter] = useState<ActionFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [ripples, setRipples] = useState<{ id: number, x: number, y: number }[]>([]);
  const [undoModal, setUndoModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [period, setPeriod] = useState(1);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  const timerRef = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (id) {
      const data = dbService.getGame(id);
      if (data) setGame(data);
    }
  }, [id]);

  useEffect(() => {
    if (game) dbService.updateGame(game);
  }, [game]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  if (!game) return <div className="p-8 text-center text-onSurfaceVariant font-bold">Cargando datos...</div>;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const showPassSnackbar = (count: number, isRecord: boolean) => {
    if (!isRecord) return; // Elimina el aviso de "cadena interrumpida"
    const message = `🏆 ¡Nuevo récord: ${count} pases!`;
    setSnackbar({ message, visible: true });
    setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2500);
  };

  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const rid = Date.now();
    setRipples(prev => [...prev, { id: rid, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rid)), 600);

    const now = Date.now();
    const isDouble = now - lastClickTime.current < 300;
    lastClickTime.current = now;

    if (isDouble) {
      if (navigator.vibrate) navigator.vibrate(200);
      registerEvent('FALTA / PÉRDIDA', Possession.AWAY, x, y, "Cometida", game.teamHome.id);
      setShowPopup({ x, y, type: 'FOUL' });
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);

    const isInTopGoal = y <= 8 && x >= 42 && x <= 58;
    const isInBottomGoal = y >= 92 && x >= 42 && x <= 58;

    if (isInTopGoal || isInBottomGoal) { 
      setShowPopup({ x, y, type: 'SHOT', targetGoal: isInTopGoal ? 'TOP' : 'BOTTOM' }); 
      return; 
    }

    const type = possession === Possession.HOME ? 'PÉRDIDA' : 'RECUPERO';
    const newPoss = possession === Possession.HOME ? Possession.AWAY : Possession.HOME;
    
    registerEvent(type, newPoss, x, y, undefined, game.teamHome.id);
  };

  const registerEvent = (type: string, nextPoss: Possession, x: number, y: number, details?: string, forcedTeamId?: string, scoringTeam?: Possession, audioData?: string) => {
    let finalDetails = details || "";
    let updatedPassChains = [...game.passChains];
    let finalNewPoss = nextPoss;
    const currentMax = game.passChains.length > 0 ? Math.max(...game.passChains) : 0;

    const isChainBreaker = type.includes('FALTA') || type.includes('PÉRDIDA') || type.includes('GOL') || type.includes('DESVIADO') || type === 'RECUPERO';
    
    if (isChainBreaker && passCount > 0) {
      updatedPassChains.push(passCount);
      const isNewRecord = passCount > currentMax;
      showPassSnackbar(passCount, isNewRecord);
      finalDetails = `${finalDetails}${finalDetails ? ' | ' : ''}(${passCount} pases)`;
      setPassCount(0);
    }

    if (type.includes('FALTA')) {
      finalNewPoss = Possession.AWAY;
    }

    if (type.includes('GOL') || type.includes('DESVIADO') || type.includes('ATAJADO')) {
      if (possession === Possession.HOME) finalNewPoss = Possession.AWAY;
      else if (type.includes('GOL')) finalNewPoss = scoringTeam === Possession.HOME ? Possession.AWAY : Possession.HOME;
    }

    const attackingTeamId = possession === Possession.HOME ? game.teamHome.id : game.teamAway.id;
    const eventTeamId = (type.includes('DISPARO') || type.includes('GOL')) ? attackingTeamId : (forcedTeamId || (finalNewPoss === Possession.HOME ? game.teamHome.id : game.teamAway.id));

    const event: GameEvent = {
      id: Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      gameTime: `${period}Q ${formatTime(seconds)}`,
      type,
      teamId: eventTeamId,
      x: Math.round(x),
      y: Math.round(y),
      details: finalDetails,
      audioData: audioData
    };
    
    let updatedScoreHome = game.scoreHome;
    let updatedScoreAway = game.scoreAway;
    
    if (type.includes('GOL')) {
      if (scoringTeam === Possession.HOME) updatedScoreHome++;
      else if (scoringTeam === Possession.AWAY) updatedScoreAway++;
    }

    const updatedGame = {
      ...game,
      scoreHome: updatedScoreHome,
      scoreAway: updatedScoreAway,
      events: [...game.events, event],
      passChains: updatedPassChains
    };

    setGame(updatedGame);
    if (finalNewPoss !== Possession.NONE) setPossession(finalNewPoss);
    setShowPopup(null);
  };

  const updateLastEvent = (newType: string, newDetails: string) => {
    setGame(prev => {
      if (!prev || prev.events.length === 0) return prev;
      const lastEvent = prev.events[prev.events.length - 1];
      if (lastEvent.type.includes('FALTA')) {
        const updatedEvents = [...prev.events];
        updatedEvents[updatedEvents.length - 1] = {
          ...lastEvent,
          type: newType,
          details: newDetails
        };
        return { ...prev, events: updatedEvents };
      }
      return prev;
    });
    setShowPopup(null);
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
  };

  const getStat = (types: string[]) => {
     return game.events.filter(e => {
        const isTeam = e.teamId === game.teamHome.id;
        const isTarget = types.some(t => e.type.toUpperCase().includes(t.toUpperCase()));
        return isTeam && isTarget;
     }).length;
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
          setTimeout(() => setSnackbar(prev => ({...prev, visible: false})), 2000);
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        setSnackbar({ message: "Error al acceder al micrófono.", visible: true });
        setTimeout(() => setSnackbar(prev => ({...prev, visible: false})), 2000);
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

  const handleFinishGame = () => {
    const state = dbService.loadState();
    dbService.saveState({ ...state, activeGameId: null });
    navigate(`/summary/${game.id}`);
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(base64);
    audio.play();
  };

  const hasPasses = game.passChains.length > 0;
  const pAvg = hasPasses ? (game.passChains.reduce((a, b) => a + b, 0) / game.passChains.length).toFixed(1) : 0;
  const pMax = hasPasses ? Math.max(...game.passChains) : 0;
  const pMin = hasPasses ? Math.min(...game.passChains) : 0;

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
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
              eventFilter === f.id 
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
        {[ { id: 'ALL', label: 'Todos Q' }, { id: 1, label: '1Q' }, { id: 2, label: '2Q' }, { id: 3, label: '3Q' }, { id: 4, label: '4Q' } ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodFilter(p.id as PeriodFilter)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
              periodFilter === p.id 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-surface text-onSurfaceVariant/60 border-surfaceVariant hover:border-primary/40'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  const isIn23Zone = (y: number) => y < 23 || y > 77;

  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden select-none transition-all duration-500">
      
      {snackbar.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-brandDark text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-300 border border-primary/20 flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest">{snackbar.message}</span>
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
              {["1: Configurar juego", "2: Configurar plantel", "3: Configurar acciones", "4: Reiniciar juego", "5: Suspender juego"].map((opt, i) => (
                <button key={i} className="w-full text-left p-4 rounded-xl hover:bg-surface text-onSurface font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95" onClick={() => setIsMenuOpen(false)}>{opt}</button>
              ))}
            </nav>
            <div className="pt-6 mt-6 border-t border-surfaceVariant">
              <button onClick={() => navigate('/dashboard')} className="w-full text-left p-4 bg-red-50 text-red-600 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-red-100 active:scale-95"><span>🏠</span> 6: Regresar al dashboard</button>
            </div>
          </aside>
        </div>
      )}

      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 border-b border-surfaceVariant shadow-sm z-[200]">
        <button onClick={() => setIsMenuOpen(true)} className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 group">
          <div className="w-6 h-0.5 bg-dark" />
          <div className="w-6 h-0.5 bg-dark" />
          <div className="w-4 h-0.5 bg-dark self-start ml-1" />
        </button>
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-4 overflow-hidden">
          <span className="hidden sm:block text-[10px] md:text-xs font-black text-onSurfaceVariant uppercase truncate max-w-[80px] md:max-w-[120px] text-right">{game.teamHome.name}</span>
          <div className="px-3 md:px-5 py-1.5 rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px] border border-surfaceVariant shadow-inner" style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc', color: game.teamHome.secondaryColor || '#ffffff' }}>
            <span className="text-xl md:text-3xl font-black">{game.scoreHome}</span>
          </div>
          <NSeparator />
          <div className="px-3 md:px-5 py-1.5 rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px] border border-surfaceVariant shadow-inner" style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444', color: game.teamAway.secondaryColor || '#ffffff' }}>
            <span className="text-xl md:text-3xl font-black">{game.scoreAway}</span>
          </div>
          <span className="hidden sm:block text-[10px] md:text-xs font-black text-onSurfaceVariant uppercase truncate max-w-[80px] md:max-w-[120px]">{game.teamAway.name}</span>
        </div>
        
        {/* Indicador de Periodo a la izquierda del cronómetro */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button 
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="bg-primary/10 text-primary font-black px-3 py-2 rounded-xl text-xs md:text-sm active:scale-95 transition-all shadow-sm border border-primary/5"
            >
              {period}Q
            </button>
            {showPeriodMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-surfaceVariant shadow-2xl rounded-2xl p-1.5 z-[300] flex flex-col min-w-[60px] animate-in zoom-in duration-150">
                {[1, 2, 3, 4].map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setPeriod(q); setShowPeriodMenu(false); }} 
                    className={`px-4 py-2.5 text-[10px] font-black rounded-xl transition-colors ${period === q ? 'bg-primary text-white shadow-md' : 'text-onSurfaceVariant hover:bg-surface'}`}
                  >
                    {q}Q
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-surface px-3 py-1.5 rounded-xl border border-surfaceVariant flex items-center gap-3">
            <p className="text-lg md:text-xl font-black text-primary tabular-nums leading-none">{formatTime(seconds)}</p>
            <button onClick={() => setIsRunning(!isRunning)} className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-all text-[10px]">{isRunning ? '||' : '▶'}</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-surface">
        <aside className={`hidden lg:flex w-[320px] flex-col p-5 bg-white border-r border-surfaceVariant ${activeView !== 'field' ? 'lg:flex' : ''}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 border-b border-surfaceVariant pb-2 italic">Listado de Acciones</h3>
            <FilterChips />
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar no-scrollbar">
              {filteredEvents.map((e) => (
                <div key={e.id} className="bg-surface/50 border border-surfaceVariant p-3 rounded-2xl flex flex-col gap-2 group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-primary font-black text-[9px] bg-primary/5 px-1.5 py-0.5 rounded shrink-0">{e.gameTime}</span>
                      <div className="min-w-0">
                        <p className="text-dark text-[11px] font-bold truncate uppercase">{e.type}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(e.id)} className="text-onSurfaceVariant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                  {e.type === 'NOTA TEXTO' ? (
                    <p className="text-[10px] text-dark bg-white/50 p-2 rounded-lg border border-surfaceVariant italic">{e.details}</p>
                  ) : e.type === 'NOTA VOZ' && e.audioData ? (
                    <button onClick={() => playAudio(e.audioData!)} className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 py-2 px-3 rounded-xl active:scale-95 transition-all">
                      <span>▶️ Reproducir Audio</span>
                    </button>
                  ) : (
                    <p className="text-[8px] text-onSurfaceVariant truncate uppercase font-black">{e.details || `COORD ${e.x},${e.y}`}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 relative p-2 flex gap-2 overflow-hidden">
          <div className={`lg:hidden w-14 flex flex-col gap-1.5 py-1 shrink-0 ${activeView !== 'field' ? 'hidden' : 'flex'}`}>
               {[
                 { label: 'REM', icon: '🥅', val: getStat(['DISPARO']), col: 'text-dark' },
                 { label: 'PER', icon: '📉', val: getStat(['PÉRDIDA']), col: 'text-orange-600' },
                 { label: 'REC', icon: '📈', val: getStat(['RECUPERO']), col: 'text-green-600' },
                 { label: 'FAL', icon: '⚠️', val: getStat(['FALTA']), col: 'text-red-600' },
               ].map((st, i) => (
                 <div key={i} className="flex-1 bg-white border border-surfaceVariant rounded-xl flex flex-col items-center justify-center shadow-sm p-1">
                   <span className="text-[10px] mb-0.5">{st.icon}</span>
                   <span className="text-[6px] font-black text-onSurfaceVariant uppercase leading-none mb-0.5">{st.label}</span>
                   <span className={`text-[11px] font-black ${st.col} leading-none`}>{st.val}</span>
                 </div>
               ))}
          </div>

          <div className="flex-1 relative overflow-hidden">
            {activeView === 'heatmap' ? (
              <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-dark uppercase tracking-widest">Mapa de Calor</h3>
                  <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                </div>
                <div className="flex-1 relative overflow-hidden rounded-[24px]">
                  <div className="absolute inset-0 bg-emerald-800 opacity-20">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -translate-y-1/2" />
                  </div>
                  <div className="absolute inset-0">
                    {game.events.filter(e => eventFilter === 'ALL' || e.type.includes(eventFilter)).map((e, i) => (
                      <div key={i} className={`absolute w-12 h-12 rounded-full blur-2xl opacity-60 mix-blend-multiply ${e.type.includes('PÉRDIDA') ? 'bg-orange-400' : e.type.includes('FALTA') ? 'bg-red-400' : 'bg-primary'}`} style={{ left: `${e.x}%`, top: `${e.y}%`, transform: 'translate(-50%, -50%)' }} />
                    ))}
                  </div>
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
                          <p className="text-dark text-sm font-bold uppercase">{e.type}</p>
                        </div>
                        <button onClick={() => deleteEvent(e.id)} className="text-red-400 p-2">✕</button>
                      </div>
                      <p className="text-[10px] text-onSurfaceVariant uppercase font-black">{e.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeView === 'stats' ? (
              <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-dark uppercase tracking-widest">Estadísticas Live</h3>
                  <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <div className="space-y-4">
                    {[
                      { l1: 'Goles', v1: game.scoreHome, c1: 'text-primary', l2: 'Remates', v2: getStat(['DISPARO']), c2: 'text-dark' },
                      { l1: 'Pérdidas', v1: getStat(['PÉRDIDA']), c1: 'text-orange-600', l2: 'Recuperos', v2: getStat(['RECUPERO']), c2: 'text-green-600' },
                      { l1: 'Faltas', v1: getStat(['FALTA']), c1: 'text-red-600', l2: 'C. Cortos', v2: getStat(['CORNER CORTO']), c2: 'text-indigo-600' },
                    ].map((row, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4">
                        <div className="bg-surface/50 p-6 rounded-[24px] border border-surfaceVariant text-center">
                          <p className="text-[9px] font-black text-onSurfaceVariant uppercase mb-1">{row.l1}</p>
                          <p className={`text-4xl font-black ${row.c1} leading-none`}>{row.v1}</p>
                        </div>
                        <div className="bg-surface/50 p-6 rounded-[24px] border border-surfaceVariant text-center">
                          <p className="text-[9px] font-black text-onSurfaceVariant uppercase mb-1">{row.l2}</p>
                          <p className={`text-4xl font-black ${row.c2} leading-none`}>{row.v2}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-emerald-700 border-2 border-white/40 rounded-[32px] relative cursor-crosshair overflow-hidden shadow-lg" onClick={handleFieldClick}>
                <div className="absolute top-0 left-[42%] w-[16%] h-[8%] border-b-2 border-x-2 border-white/50 rounded-b-xl bg-black/10 z-10 transition-colors hover:bg-black/20" title="Arco Superior" />
                <div className="absolute bottom-0 left-[42%] w-[16%] h-[8%] border-t-2 border-x-2 border-white/50 rounded-t-xl bg-black/10 z-10 transition-colors hover:bg-black/20" title="Arco Inferior" />

                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
                <div className="absolute top-[23%] left-0 right-0 h-px border-t border-dashed border-white/20" />
                <div className="absolute bottom-[23%] left-0 right-0 h-px border-t border-dashed border-white/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 border-4 border-white/10 rounded-full -translate-y-1/2" style={{ width: '53%', height: '32%' }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-4 border-white/10 rounded-full translate-y-1/2" style={{ width: '53%', height: '32%' }} />
                
                {ripples.map(r => <div key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: '24px', height: '24px', marginLeft: '-12px', marginTop: '-12px' }} />)}

                {showPopup && (
                  <div 
                    className={`absolute z-[300] bg-white shadow-2xl rounded-[32px] p-6 flex flex-col gap-3 min-w-[200px] border border-surfaceVariant animate-in zoom-in duration-150`} 
                    style={{ 
                        left: `${showPopup.x}%`, 
                        top: showPopup.y < 35 ? `${showPopup.y + 10}%` : `${showPopup.y}%`, 
                        transform: showPopup.y < 35 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }} 
                    onClick={e => e.stopPropagation()}
                  >
                    <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest border-b border-surfaceVariant pb-2 mb-1">Resultado de Acción</p>
                    {showPopup.type === 'FOUL' ? (
                      <div className="grid grid-cols-1 gap-2">
                        {!isIn23Zone(showPopup.y) ? (
                          <div className="grid grid-cols-3 gap-2">
                             <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex items-center justify-center gap-2" onClick={() => updateLastEvent('FALTA (VERDE) / PÉRDIDA', 'VERDE')}>
                               <span className="w-2.5 h-2.5 bg-green-500 rounded-sm shrink-0"></span> VER
                             </button>
                             <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex items-center justify-center gap-2" onClick={() => updateLastEvent('FALTA (AMARILLA) / PÉRDIDA', 'AMARILLA')}>
                               <span className="w-2.5 h-2.5 bg-yellow-400 rounded-sm shrink-0"></span> AMA
                             </button>
                             <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex items-center justify-center gap-2" onClick={() => updateLastEvent('FALTA (ROJA) / PÉRDIDA', 'ROJA')}>
                               <span className="w-2.5 h-2.5 bg-red-600 rounded-sm shrink-0"></span> ROJ
                             </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                             <button className="text-[10px] font-black text-indigo-600 py-3 rounded-xl bg-indigo-50 border border-indigo-100 uppercase flex items-center justify-center gap-2" onClick={() => updateLastEvent('CORNER CORTO / PÉRDIDA', "C. CORTO")}>🏑 C. CORTO</button>
                             <button className="text-[10px] font-black text-purple-600 py-3 rounded-xl bg-purple-50 border border-purple-100 uppercase flex items-center justify-center gap-2" onClick={() => updateLastEvent('PENAL / PÉRDIDA', "PENAL")}>🎯 PENAL</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <button className="text-xs font-black text-primary text-left py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4 uppercase" onClick={() => registerEvent('DISPARO (GOL)', showPopup.targetGoal === 'TOP' ? Possession.AWAY : Possession.HOME, showPopup.x, showPopup.y, "GOL", undefined, showPopup.targetGoal === 'TOP' ? Possession.HOME : Possession.AWAY)}>⚽ GOL</button>
                        <button className="text-xs font-black text-dark text-left py-4 px-5 rounded-xl bg-surface border border-surfaceVariant flex items-center gap-4 uppercase" onClick={() => registerEvent('DISPARO (ATAJADO)', Possession.NONE, showPopup.x, showPopup.y, "ATAJADO")}>🛡️ ATAJADO</button>
                        <button className="text-xs font-black text-onSurfaceVariant text-left py-4 px-5 rounded-xl bg-surface border border-surfaceVariant flex items-center gap-4 uppercase" onClick={() => registerEvent('DISPARO (DESVIADO)', Possession.AWAY, showPopup.x, showPopup.y, "DESVIADO")}>💨 DESVIADO</button>
                      </>
                    )}
                    <button className="text-[8px] font-black text-onSurfaceVariant uppercase mt-1 text-center py-1 hover:text-primary transition-colors" onClick={() => setShowPopup(null)}>Cerrar</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`lg:hidden w-12 flex flex-col gap-1.5 py-1 shrink-0 ${activeView !== 'field' ? 'hidden' : 'flex'}`}>
               <button onClick={handleVoiceNote} className={`flex-1 rounded-xl flex items-center justify-center transition-all shadow-sm border ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white border-surfaceVariant text-onSurfaceVariant/40'}`}>{isRecording ? '⏺' : '🎤'}</button>
               <button onClick={() => setShowNoteModal(true)} className="flex-1 bg-white border border-surfaceVariant rounded-xl flex items-center justify-center text-onSurfaceVariant/40 active:scale-95 transition-all text-xl shadow-sm">📝</button>
          </div>
        </div>

        <aside className="hidden lg:flex w-[320px] flex-col p-5 bg-white border-l border-surfaceVariant">
          <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 border-b border-surfaceVariant pb-2 italic">Estadísticas Rápidas</h3>
            <div className="space-y-4 pb-4 border-b border-surfaceVariant mb-4">
              {[
                { l1: 'Remates', v1: getStat(['DISPARO']), c1: 'text-dark', l2: 'Pérdidas', v2: getStat(['PÉRDIDA']), c2: 'text-orange-600' },
                { l1: 'Recuperos', v1: getStat(['RECUPERO']), c1: 'text-green-600', l2: 'Faltas', v2: getStat(['FALTA']), c2: 'text-red-600' },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-3">
                  <div className="bg-surface/40 p-3 rounded-2xl border border-surfaceVariant text-center shadow-inner">
                    <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-1">{row.l1}</p>
                    <p className={`text-2xl font-black ${row.c1} leading-none`}>{row.v1}</p>
                  </div>
                  <div className="bg-surface/40 p-3 rounded-2xl border border-surfaceVariant text-center shadow-inner">
                    <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-1">{row.l2}</p>
                    <p className={`text-2xl font-black ${row.c2} leading-none`}>{row.v2}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 italic">Detalle de Pases</h3>
            <div className="grid grid-cols-1 gap-3 pb-10">
              <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-center justify-between shadow-sm">
                <span className="text-[9px] font-black text-primary uppercase">Promedio</span>
                <span className="text-2xl font-black text-primary">{pAvg}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface/50 p-3 rounded-2xl border border-surfaceVariant text-center shadow-inner">
                  <p className="text-[8px] font-black text-onSurfaceVariant uppercase">Mínimo</p>
                  <p className="text-lg font-black text-dark leading-tight">{pMin}</p>
                </div>
                <div className="flex-1 bg-surface/50 p-3 rounded-2xl border border-surfaceVariant text-center shadow-inner">
                  <p className="text-[8px] font-black text-onSurfaceVariant uppercase">Máximo</p>
                  <p className="text-lg font-black text-dark leading-tight">{pMax}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-20 md:h-24 bg-white flex items-center justify-between px-6 md:px-10 shrink-0 border-t border-surfaceVariant shadow-lg relative z-[200]">
        <div className="relative">
          <button className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-red-50 text-red-600 text-xl flex items-center justify-center border border-red-100 active:scale-90 shadow-sm" onClick={() => setUndoModal(true)}>↩</button>
          {undoModal && (
            <div className="absolute bottom-16 left-0 bg-white border border-surfaceVariant p-5 rounded-[28px] shadow-2xl w-52 animate-in slide-in-from-bottom duration-200 z-[200]">
              <p className="text-[9px] text-onSurfaceVariant font-black uppercase mb-4 text-center">¿Deshacer?</p>
              <div className="flex gap-2.5">
                <button onClick={() => { if(game.events.length > 0) deleteEvent(game.events[game.events.length-1].id); setUndoModal(false); }} className="flex-1 bg-red-600 text-white text-[9px] font-black py-3 rounded-xl uppercase">BORRAR</button>
                <button onClick={() => setUndoModal(false)} className="flex-1 bg-surfaceVariant text-onSurfaceVariant text-[9px] font-black py-3 rounded-xl uppercase">NO</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-6 md:gap-10">
          <button className={`lg:hidden text-2xl transition-all ${activeView === 'list' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'list' ? 'field' : 'list')}>📋</button>
          <button className={`text-3xl md:text-4xl transition-all ${activeView === 'heatmap' ? 'text-primary scale-125 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'heatmap' ? 'field' : 'heatmap')}>🔥</button>
          <div className="hidden lg:flex items-center gap-4">
             <button onClick={handleVoiceNote} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-surface text-onSurfaceVariant/40 border border-surfaceVariant active:scale-90 shadow-sm'}`}>🎤</button>
             <button onClick={() => setShowNoteModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center bg-surface text-onSurfaceVariant/40 border border-surfaceVariant active:scale-90 shadow-sm">📝</button>
          </div>
          <button className={`lg:hidden text-2xl transition-all ${activeView === 'stats' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'stats' ? 'field' : 'stats')}>📊</button>
        </div>

        <button 
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl font-black shadow-xl relative transition-all active:scale-95 border-2 ${possession === Possession.HOME ? 'bg-primary text-white border-primary translate-y-[-4px]' : 'bg-surface text-onSurfaceVariant/20 border-surfaceVariant'}`}
          onClick={() => setPassCount(c => c + 1)}
          disabled={possession !== Possession.HOME}
        >
          <span>+</span>
          {passCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-secondary text-onSecondary text-[11px] w-7 h-7 flex items-center justify-center rounded-full border-[2px] border-white font-black animate-in zoom-in shadow-md">
              {passCount}
            </span>
          )}
        </button>
      </footer>
    </div>
  );
};

export default LiveGameView;
