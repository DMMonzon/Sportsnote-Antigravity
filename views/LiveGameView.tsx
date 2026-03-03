
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';
import { UserRole, Game, GameEvent, Possession } from '../types';
import { dbService } from '../services/dbService';
import { aiService } from '../services/aiService';

const NSeparator = () => (
  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0">
    <img
      src="/assets/logo-sportsnote-v2.png"
      alt="Sportsnote Logo"
      className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
    />
  </div>
);

type ActionFilter = 'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO';
type PeriodFilter = 'ALL' | 1 | 2 | 3 | 4;

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
  const [showPopup, setShowPopup] = useState<{ x: number, y: number, type: 'FOUL' | 'SHOT', targetGoal?: 'TOP' | 'BOTTOM' } | null>(null);

  // Modal de detalles de gol
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalAuthor, setGoalAuthor] = useState('');
  const [goalType, setGoalType] = useState<'Individual' | 'Colectiva' | 'Penal' | 'Corto' | null>(null);
  const [pendingGoalAction, setPendingGoalAction] = useState<{ scoreUpdate: { home: number, away: number }, nextPoss: Possession } | null>(null);

  const [activeView, setActiveView] = useState<'field' | 'list' | 'heatmap' | 'stats'>('field');
  const [eventFilter, setEventFilter] = useState<ActionFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [ripples, setRipples] = useState<{ id: number, x: number, y: number }[]>([]);
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

  // Estados de orientación de la cancha
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRunning) {
      if (possession === Possession.NONE) {
        setSnackbar({ message: "Inicia el cronómetro para registrar acciones", visible: true });
        setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * 100;
    const vy = ((e.clientY - rect.top) / rect.height) * 100;

    // Transformación de coordenadas basada en la vista
    let x = vx;
    let y = vy;

    if (isLandscape) {
      // En modo horizontal nativo (sin rotación CSS):
      // Click Izquierda (vx=0) -> Arriba (y=0)
      // Click Derecha (vx=100) -> Abajo (y=100)
      // Click Superior (vy=0) -> Derecha (x=100)
      // Click Inferior (vy=100) -> Izquierda (x=0)
      x = 100 - vy;
      y = vx;
    }

    if (isFlipped) {
      // Espejado Arriba-Abajo (y opcionalmente Izquierda-Derecha para coherencia)
      x = 100 - x;
      y = 100 - y;
    }

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

    if (isInTopGoal) {
      if (possession !== Possession.HOME) {
        setSnackbar({ message: "Solo puedes disparar al arco rival con la posesión del balón", visible: true });
        setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
        return;
      }
      registerEvent('DISPARO', Possession.NONE, x, y, "Remate", game.teamHome.id);
      setShowPopup({ x, y, type: 'SHOT', targetGoal: 'TOP' });
      return;
    }
    if (isInBottomGoal) {
      if (possession !== Possession.AWAY) {
        setSnackbar({ message: "Solo el rival puede disparar en tu arco propio", visible: true });
        setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 2000);
        return;
      }
      registerEvent('DISPARO', Possession.NONE, x, y, "Remate", game.teamAway.id);
      setShowPopup({ x, y, type: 'SHOT', targetGoal: 'BOTTOM' });
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

    const isChainBreaker = type.includes('FALTA') || type.includes('PÉRDIDA') || type.includes('GOL') || type.includes('DESVIADO') || type === 'RECUPERO' || type === 'DISPARO';

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
    const eventTeamId = forcedTeamId || ((type.includes('DISPARO') || type.includes('GOL')) ? attackingTeamId : (finalNewPoss === Possession.HOME ? game.teamHome.id : game.teamAway.id));

    const sector = getSectorInfo(x, y);

    const event: GameEvent = {
      id: Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      gameTime: `${period}Q ${formatTime(seconds)}`,
      type,
      teamId: eventTeamId,
      x: Math.round(x),
      y: Math.round(y),
      half: sector.half,
      lane: sector.lane,
      details: finalDetails,
      audioData: audioData,
      scoringTeam: scoringTeam
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

    // Si es una nota de voz, iniciar transcripción
    if (type === 'NOTA VOZ' && audioData) {
      handleTranscription(event.id, audioData);
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

      if (lastEvent.type.includes('FALTA') || lastEvent.type.includes('DISPARO')) {
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
    setPossession(nextPoss);
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
    const finalDetails = `GOL${foulPlayer ? ` (#${foulPlayer})` : ''} | ${authorStr} | ${typeStr}`;

    updateLastEvent('DISPARO (GOL)', finalDetails, pendingGoalAction.scoreUpdate, pendingGoalAction.nextPoss);
    resetGoalModal();
  };

  const skipGoalDetails = () => {
    if (!pendingGoalAction) return;
    updateLastEvent('DISPARO (GOL)', 'GOL | Jugador: N/A | Tipo: No especificado', pendingGoalAction.scoreUpdate, pendingGoalAction.nextPoss);
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
      const isTarget = types.some(t => e.type.toUpperCase().includes(t.toUpperCase()));
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return isTeam && isTarget && periodMatch;
    });

    return {
      total: events.length,
      own: events.filter(e => e.half === 'own').length,
      rival: events.filter(e => e.half === 'rival').length,
      left: events.filter(e => e.lane === 'left').length,
      center: events.filter(e => e.lane === 'center').length,
      right: events.filter(e => e.lane === 'right').length
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

  const handleFinishGame = () => {
    if (!game) return;
    onExitGame();
    telemetryService.logEvent(TelemetryEvent.FINISH_GAME, {
      gameId: game.id,
      score: `${game.scoreHome}-${game.scoreAway}`
    });
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


  const StatDetailCard = ({ title, types, colorClass, showDetails = true, compact = false, teamId, icon }: { title: string, types: string[], colorClass: string, showDetails?: boolean, compact?: boolean, teamId?: string, icon?: string }) => {
    const data = getDetailedStat(types, teamId);

    const colorMap: { [key: string]: { text: string, bg: string, border: string, accent: string } } = {
      'text-orange-600': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-500' },
      'text-emerald-600': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-500' },
      'text-red-600': { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-500' },
      'text-slate-700': { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-500' },
    };
    const style = colorMap[colorClass] || colorMap['text-slate-700'];
    const highlightBg = style.bg.replace('50', '100'); // Más intenso para el máximo

    const halfValues = [data.own, data.rival].filter(v => v > 0);
    const maxHalfVal = halfValues.length > 0 ? Math.max(...halfValues) : -1;
    const isMaxHalf = (val: number) => val > 0 && val === maxHalfVal;

    const laneValues = [data.left, data.center, data.right].filter(v => v > 0);
    const maxLaneVal = laneValues.length > 0 ? Math.max(...laneValues) : -1;
    const isMaxLane = (val: number) => val > 0 && val === maxLaneVal;

    return (
      <div className={`bg-surface/50 ${compact ? 'p-3 rounded-2xl' : 'p-5 rounded-[28px]'} border border-surfaceVariant shadow-sm flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className={`flex justify-between items-center ${showDetails ? 'border-b border-surfaceVariant pb-2' : ''}`}>
          <div className="flex items-center gap-2">
            {icon && <span className="text-xs">{icon}</span>}
            <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{title}</p>
          </div>
          <span className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-dark`}>{data.total}</span>
        </div>

        {showDetails && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.own) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
                <span className={`${isMaxHalf(data.own) ? style.accent : 'text-blue-500'} text-[10px]`}>↓</span>
                <div className="flex flex-col">
                  <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.own) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>Propio</span>
                  <span className="text-[11px] font-black leading-none text-dark">{data.own}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.rival) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
                <span className={`${isMaxHalf(data.rival) ? style.accent : 'text-orange-500'} text-[10px]`}>↑</span>
                <div className="flex flex-col">
                  <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.rival) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>Rival</span>
                  <span className="text-[11px] font-black leading-none text-dark">{data.rival}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.left) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
                <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.left) ? style.text : 'text-onSurfaceVariant'}`}>Izq</span>
                <span className="text-[10px] font-black text-dark">{data.left}</span>
              </div>
              <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.center) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
                <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.center) ? style.text : 'text-onSurfaceVariant'}`}>Ctr</span>
                <span className="text-[10px] font-black text-dark">{data.center}</span>
              </div>
              <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.right) ? `${highlightBg} ${style.border} shadow-sm` : 'bg-white/40 border-surfaceVariant/30'}`}>
                <span className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.right) ? style.text : 'text-onSurfaceVariant'}`}>Der</span>
                <span className="text-[10px] font-black text-dark">{data.right}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

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
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden select-none transition-all duration-500">

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
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-4 overflow-hidden">
          <button
            onClick={() => selectPossession(Possession.HOME)}
            className={`hidden sm:block text-[10px] md:text-xs font-black uppercase truncate max-w-[80px] md:max-w-[120px] text-right transition-opacity ${possession === Possession.HOME ? 'text-primary opacity-100' : 'text-onSurfaceVariant opacity-30'}`}
          >
            {game.teamHome.name}
          </button>

          <button
            onClick={() => selectPossession(Possession.HOME)}
            className={`px-3 md:px-5 py-1.5 rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px] border transition-all duration-300 ${possession === Possession.HOME ? 'ring-4 ring-secondary border-transparent scale-105 shadow-xl' : 'border-surfaceVariant shadow-inner opacity-40'} ${!isRunning && possession === Possession.NONE && seconds === 0 ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: game.teamHome.primaryColor || '#6d5dfc', color: game.teamHome.secondaryColor || '#ffffff' }}
          >
            <span className="text-xl md:text-3xl font-black">{game.scoreHome}</span>
            {possession === Possession.HOME && <span className="text-[6px] font-black uppercase mt-0.5 tracking-tighter">POSESIÓN</span>}
          </button>

          <NSeparator />

          <button
            onClick={() => selectPossession(Possession.AWAY)}
            className={`px-3 md:px-5 py-1.5 rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px] border transition-all duration-300 ${possession === Possession.AWAY ? 'ring-4 ring-secondary border-transparent scale-105 shadow-xl' : 'border-surfaceVariant shadow-inner opacity-40'} ${!isRunning && possession === Possession.NONE && seconds === 0 ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: game.teamAway.primaryColor || '#ef4444', color: game.teamAway.secondaryColor || '#ffffff' }}
          >
            <span className="text-xl md:text-3xl font-black">{game.scoreAway}</span>
            {possession === Possession.AWAY && <span className="text-[6px] font-black uppercase mt-0.5 tracking-tighter">POSESIÓN</span>}
          </button>

          <button
            onClick={() => selectPossession(Possession.AWAY)}
            className={`hidden sm:block text-[10px] md:text-xs font-black uppercase truncate max-w-[80px] md:max-w-[120px] transition-opacity ${possession === Possession.AWAY ? 'text-primary opacity-100' : 'text-onSurfaceVariant opacity-30'}`}
          >
            {game.teamAway.name}
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
          <aside className="hidden lg:flex w-[320px] flex-col p-5 bg-white border-r border-surfaceVariant">
            <div className="flex flex-col h-full overflow-hidden">
              <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 border-b border-surfaceVariant pb-2 italic">Listado de Acciones</h3>
              <FilterChips />
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar no-scrollbar">
                {filteredEvents.map((e) => (
                  <div key={e.id} className="bg-surface/50 border border-surfaceVariant p-3 rounded-2xl flex flex-col gap-2 group hover:bg-white transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-primary font-black text-[9px] bg-primary/5 px-1.5 py-0.5 rounded shrink-0">{e.gameTime}</span>
                        <div className="min-w-0 flex items-center gap-2">
                          {(e.type.includes('DISPARO') || e.type.includes('GOL') || e.type.includes('FALTA')) && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded border border-current shrink-0 min-w-[18px] text-center"
                              style={{
                                color: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                borderColor: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? (game.teamHome.primaryColor || '#6d5dfc') : (game.teamAway.primaryColor || '#ef4444'),
                                backgroundColor: (e.teamId === game.teamHome.id || e.scoringTeam === Possession.HOME) ? `${game.teamHome.primaryColor || '#6d5dfc'}11` : `${game.teamAway.primaryColor || '#ef4444'}11`
                              }}
                            >
                              {((e.teamId === game.teamHome.id && !e.type.includes('GOL')) || (e.scoringTeam === Possession.HOME)) ? 'L' : 'V'}
                            </span>
                          )}
                          <p className="text-dark text-[11px] font-bold truncate uppercase">{e.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEventToEdit(e)} className="text-onSurfaceVariant hover:text-primary p-1">✏️</button>
                        <button onClick={() => deleteEvent(e.id)} className="text-onSurfaceVariant hover:text-red-500 p-1">✕</button>
                      </div>
                    </div>
                    {e.isTranscribing ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-primary animate-pulse">Transcribiendo...</span>
                      </div>
                    ) : e.type === 'NOTA VOZ' && e.transcription ? (
                      <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                        <p className="text-[10px] text-dark italic leading-tight">{e.transcription}</p>
                      </div>
                    ) : e.type === 'NOTA TEXTO' ? (
                      <p className="text-[10px] text-dark bg-white/50 p-2 rounded-lg border border-surfaceVariant italic">{e.details}</p>
                    ) : (
                      <p className="text-[8px] text-onSurfaceVariant truncate uppercase font-black">{e.details || `COORD ${e.x},${e.y}`}</p>
                    )}
                  </div>
                ))}
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
              {activeView === 'heatmap' ? (
                <div className="w-full h-full bg-white rounded-[32px] border-2 border-surfaceVariant flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-dark uppercase tracking-widest">Mapa de Calor</h3>
                    <button onClick={() => setActiveView('field')} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">Cerrar</button>
                  </div>

                  <FilterChips />

                  <div className="flex-1 relative overflow-hidden rounded-[24px]">
                    <div className="absolute inset-0 bg-emerald-900">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -translate-y-1/2" />
                    </div>
                    <div className="absolute inset-0">
                      {game.events.filter(e => {
                        const actionMatch = eventFilter === 'ALL' || e.type.includes(eventFilter);
                        const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
                        return actionMatch && periodMatch;
                      }).map((e, i) => (
                        <div
                          key={i}
                          className={`absolute w-16 h-16 rounded-full blur-2xl opacity-90 mix-blend-screen transition-all ${e.type.includes('GOL') ? 'bg-secondary' :
                            e.type.includes('DISPARO') ? 'bg-white' :
                              e.type.includes('PÉRDIDA') ? 'bg-orange-400' :
                                e.type.includes('FALTA') ? 'bg-red-500' : 'bg-primary'
                            }`}
                          style={{ left: `${e.x}%`, top: `${e.y}%`, transform: 'translate(-50%, -50%)' }}
                        />
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

                    <div className="bg-surface/50 p-6 rounded-[24px] border border-surfaceVariant mb-6 shadow-inner">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Remates Propios */}
                      <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Remates Propios 🥅</p>
                          <span className="text-2xl font-black text-primary">{getStat(['DISPARO'])}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-surfaceVariant pt-3">
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
                      </div>

                      {/* Remates Rival */}
                      <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Remates Rival 🥅</p>
                          <span className="text-2xl font-black text-orange-600">{getStat(['DISPARO'], game.teamAway.id)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-surfaceVariant pt-3">
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
                      </div>

                      <StatDetailCard title="Pérdidas 📉" types={['PÉRDIDA']} colorClass="text-orange-600" />
                      <StatDetailCard title="Recuperos 🛡️" types={['RECUPERO']} colorClass="text-emerald-600" />
                      <StatDetailCard title="Faltas ⚠️" types={['FALTA']} colorClass="text-red-600" />
                      <StatDetailCard title="Remates 🥅" types={['DISPARO']} colorClass="text-slate-700" />
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
                <div
                  className="w-full h-full bg-emerald-700 border-2 border-white/40 rounded-[32px] relative cursor-crosshair overflow-hidden shadow-lg"
                  onClick={handleFieldClick}
                >
                  {/* Arcos Verticales */}
                  {!isLandscape && (
                    <>
                      <div
                        className="absolute top-0 left-[42%] w-[16%] h-[8%] border-b-2 border-x-2 border-white/50 rounded-b-xl z-20 transition-all hover:scale-x-110 origin-top hover:bg-white/10"
                        title="Arco Superior"
                        style={{ backgroundColor: `${isFlipped ? game.teamHome.primaryColor : game.teamAway.primaryColor}44` }}
                      />
                      <div
                        className="absolute bottom-0 left-[42%] w-[16%] h-[8%] border-t-2 border-x-2 border-white/50 rounded-t-xl z-20 transition-all hover:scale-x-110 origin-bottom hover:bg-white/10"
                        title="Arco Inferior"
                        style={{ backgroundColor: `${isFlipped ? game.teamAway.primaryColor : game.teamHome.primaryColor}44` }}
                      />
                    </>
                  )}

                  {/* Arcos Horizontales */}
                  {isLandscape && (
                    <>
                      <div
                        className="absolute left-0 top-[42%] w-[4%] h-[16%] border-r-2 border-y-2 border-white/50 rounded-r-xl z-20 transition-all hover:scale-y-110 origin-left hover:bg-white/10"
                        title="Arco Izquierdo (Superior)"
                        style={{ backgroundColor: `${isFlipped ? game.teamHome.primaryColor : game.teamAway.primaryColor}44` }}
                      />
                      <div
                        className="absolute right-0 top-[42%] w-[4%] h-[16%] border-l-2 border-y-2 border-white/50 rounded-l-xl z-20 transition-all hover:scale-y-110 origin-right hover:bg-white/10"
                        title="Arco Derecho (Inferior)"
                        style={{ backgroundColor: `${isFlipped ? game.teamAway.primaryColor : game.teamHome.primaryColor}44` }}
                      />
                    </>
                  )}

                  {/* Líneas de Campo */}
                  {!isLandscape ? (
                    <>
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
                      <div className="absolute top-[23%] left-0 right-0 h-px border-t border-dashed border-white/20" />
                      <div className="absolute bottom-[23%] left-0 right-0 h-px border-t border-dashed border-white/20" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 border-4 border-white/10 rounded-full -translate-y-1/2" style={{ width: '53%', height: '32%' }} />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-4 border-white/10 rounded-full translate-y-1/2" style={{ width: '53%', height: '32%' }} />
                    </>
                  ) : (
                    <>
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2" />
                      <div className="absolute left-[23%] top-0 bottom-0 w-px border-l border-dashed border-white/20" />
                      <div className="absolute right-[23%] top-0 bottom-0 w-px border-l border-dashed border-white/20" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 border-4 border-white/10 rounded-full -translate-x-1/2" style={{ height: '53%', width: '32%' }} />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 border-4 border-white/10 rounded-full translate-x-1/2" style={{ height: '53%', width: '32%' }} />
                    </>
                  )}

                  {ripples.map(r => <div key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: '24px', height: '24px', marginLeft: '-12px', marginTop: '-12px' }} />)}

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
                            <div className="grid grid-cols-1 gap-2">
                              {!isIn23Zone(showPopup.y) ? (
                                <div className="grid grid-cols-3 gap-2">
                                  <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5" onClick={() => updateLastEvent('FALTA (VERDE) / PÉRDIDA', 'VERDE')}>
                                    <span className="w-4 h-4 bg-green-500 rounded-sm"></span>
                                    <span>VER</span>
                                  </button>
                                  <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5" onClick={() => setFoulCardType('AMARILLA')}>
                                    <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span>
                                    <span>AMA</span>
                                  </button>
                                  <button className="text-[10px] font-black text-onSurface py-3 rounded-xl bg-surface border border-surfaceVariant flex flex-col items-center justify-center gap-1.5" onClick={() => updateLastEvent('FALTA (ROJA) / PÉRDIDA', 'ROJA')}>
                                    <span className="w-4 h-4 bg-red-600 rounded-sm"></span>
                                    <span>ROJ</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <button className="text-[10px] font-black text-indigo-600 py-3 rounded-xl bg-indigo-50 border border-indigo-100 uppercase flex items-center justify-center gap-2" onClick={() => updateLastEvent('CORNER CORTO / PÉRDIDA', "C. CORTO")}>🏑 C. CORTO</button>
                                  <button className="text-[10px] font-black text-purple-600 py-3 rounded-xl bg-purple-50 border border-purple-100 uppercase flex items-center justify-center gap-2" onClick={() => updateLastEvent('PENAL / PÉRDIDA', "PENAL")}>🎯 PENAL</button>
                                </div>
                              )}
                            </div>
                          )}
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
                              <button className="text-xs font-black text-onSurfaceVariant text-left py-4 px-5 rounded-xl bg-surface border border-surfaceVariant flex items-center gap-4 uppercase" onClick={() => updateLastEvent('DISPARO (DESVIADO)', `DESVIADO${foulPlayer ? ` - Jugador #${foulPlayer}` : ''}`, undefined, Possession.AWAY)}>💨 DESVIADO</button>
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

                  {/* Overlay de Ayuda Posesión */}
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
                </div>
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
                <div className="bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant shadow-inner">
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

                {/* Remates Sidebar */}
                <div className="bg-surface/50 p-4 rounded-[24px] border border-surfaceVariant shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-surfaceVariant pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🥅</span>
                      <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest leading-none">Remates Totales</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-black px-2 rounded-lg transition-all ${landscapeShots.home > landscapeShots.away ? 'bg-primary/10 text-dark border border-primary/20 shadow-sm' : 'text-dark opacity-40'}`}>{landscapeShots.home}</span>
                      <span className="text-xs font-bold text-onSurfaceVariant/40">/</span>
                      <span className={`text-xl font-black px-2 rounded-lg transition-all ${landscapeShots.away > landscapeShots.home ? 'bg-primary/10 text-dark border border-primary/20 shadow-sm' : 'text-dark opacity-40'}`}>{landscapeShots.away}</span>
                    </div>
                  </div>
                  {/* Detalle Local */}
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

                  {/* Detalle Visitante */}
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

                {/* Desgloses Detallados Sidebar */}
                <StatDetailCard title="Pérdidas" types={['PÉRDIDA']} colorClass="text-orange-600" compact={true} icon="📉" />
                <StatDetailCard title="Recuperos" types={['RECUPERO']} colorClass="text-emerald-600" compact={true} icon="📈" />
                <StatDetailCard title="Faltas" types={['FALTA']} colorClass="text-red-600" compact={true} icon="⚠️" />

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
      </main>

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
            <button className={`${!isLandscape ? 'lg:hidden' : ''} text-2xl transition-all ${activeView === 'list' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'list' ? 'field' : 'list')}>📋</button>
            <button className={`text-3xl transition-all ${activeView === 'heatmap' ? 'text-primary scale-125 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'heatmap' ? 'field' : 'heatmap')}>🔥</button>
            <button className={`${!isLandscape ? 'lg:hidden' : ''} text-2xl transition-all ${activeView === 'stats' ? 'text-primary scale-110 drop-shadow-md' : 'text-onSurfaceVariant/30'}`} onClick={() => setActiveView(activeView === 'stats' ? 'field' : 'stats')}>📊</button>
          </div>

          {!isLandscape && (
            <div className="flex items-center gap-4 md:gap-8">
              <button onClick={handleVoiceNote} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm border ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-surface border-surfaceVariant text-onSurfaceVariant/40'}`}>
                {isRecording ? '⏺' : '🎤'}
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
    </div>
  );
};

export default LiveGameView;
