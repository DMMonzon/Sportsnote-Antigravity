import React, { useMemo } from 'react';
import { UserRole, Game, TacticalScheme } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const GameAccordion: React.FC<{ g: Game, onStats: () => void, onShare: () => void, onRecycle: () => void, onFavorite: () => void, onDelete: () => void }> = ({ g, onStats, onShare, onRecycle, onFavorite, onDelete }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden transition-all duration-300 group/accordion">
      <div
        className="flex items-center justify-between p-2 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest shrink-0 w-10 text-center">
            {new Date(g.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
          </span>
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0 bg-black/40 px-3 py-2 rounded-lg">
            <span className="truncate text-right flex-1 text-white text-[11px] font-bold">{g.teamHome.name}</span>
            <span className="text-[11px] font-black text-white px-2.5 py-1 rounded-md leading-none shrink-0 bg-primary/20 shadow-inner flex items-center gap-1">
              {g.scoreHome} - {g.scoreAway}
              {g.isFavorite && <i className="fa-solid fa-star text-yellow-400 text-[9px] ml-1"></i>}
            </span>
            <span className="truncate text-left flex-1 text-white text-[11px] font-bold">{g.teamAway.name}</span>
          </div>
        </div>
        <button
          className="text-white/50 hover:text-white px-2 py-1 rounded-full transition-colors flex items-center justify-center shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          <i className={`fa-solid fa-chevron-right transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}></i>
        </button>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex items-center justify-center gap-2 p-3 border-t border-white/5 bg-black/20">
            <button onClick={() => onStats()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors" title="Estadísticas">
              <i className="fa-solid fa-chart-pie text-lg"></i>
            </button>
            <button onClick={() => onRecycle()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors" title="Reutilizar">
              <i className="fa-solid fa-rotate-right text-lg"></i>
            </button>
            <button onClick={() => onShare()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors" title="Compartir">
              <i className="fa-solid fa-share-nodes text-lg"></i>
            </button>
            <button onClick={() => onFavorite()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors" title="Favorito">
              <i className={`fa-solid fa-star text-lg ${g.isFavorite ? 'text-yellow-400' : ''}`}></i>
            </button>
            <button onClick={() => onDelete()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Eliminar">
              <i className="fa-solid fa-trash-can text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { id: 'juegos', label: 'Juegos', icon: <i className="fa-solid fa-play"></i> },
  { id: 'equipo', label: 'Equipo', icon: <i className="fa-solid fa-users"></i> },
  { id: 'estadisticas', label: 'Data', icon: <i className="fa-solid fa-chart-simple"></i> },
  { id: 'ajustes', label: 'Ajustes', icon: <i className="fa-solid fa-gear"></i> }
] as const;

type SectionId = typeof NAV_ITEMS[number]['id'];

interface DashboardViewProps {
  user: {
    id: string;
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    avatar?: string;
    plan?: 'free' | 'premium' | 'admin';
    cycleStartDate?: number;
    matchesCreatedInCycle?: number;
  };
  matches: Game[];
  tacticalSchemes: TacticalScheme[];
  onUpdateTactics: (tactics: TacticalScheme[]) => void;
  onLogout: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, matches, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState<SectionId>('juegos');
  const [showRecycleModal, setShowRecycleModal] = React.useState<Game | null>(null);
  const [seedingStatus, setSeedingStatus] = React.useState<string | null>(null);

  const seedFirestore = async () => {
    setSeedingStatus('Sembrando base de datos...');
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const dbAccionesJson = (await import('../acciones_de_deportes.json')).default;

      for (const sport of dbAccionesJson) {
        const docRef = doc(db, 'config_deportes', sport.id);
        await setDoc(docRef, sport);
        console.log(`Documento de ${sport.id} subido con éxito.`);
      }
      setSeedingStatus('¡Base de datos sembrada con éxito!');
      setTimeout(() => setSeedingStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSeedingStatus(`Error al sembrar: ${err.message}`);
    }
  };

  const statsData = useMemo(() => {
    const allChains = matches.flatMap(g => g.passChains || []);
    const avgChains = allChains.length > 0
      ? (allChains.reduce((a, b) => a + b, 0) / allChains.length).toFixed(1)
      : "0.0";

    const goals = matches.flatMap(g => g.events).filter(e => e.type.includes('GOL'));
    const totalGoals = goals.length > 0 ? goals.length : 0;

    const sparklineData = matches.slice(-3).map(m => ({
      val: m.events.filter(e => e.type.includes('DISPARO') || e.type.includes('GOL')).length
    }));

    return { avgChains, totalGoals, sparklineData };
  }, [matches]);

  const handleRecycle = (game: Game) => {
    navigate('/new-game', { state: { template: game } });
  };

  const handleShare = (game: Game) => {
    const text = `Resumen del partido: ${game.teamHome.name} ${game.scoreHome} - ${game.scoreAway} ${game.teamAway.name}\nVer más en SportNotes.`;
    const url = `${window.location.origin}/#/summary/${game.id}`;
    if (navigator.share) {
      navigator.share({ title: 'SportNotes Match Summary', text: text, url: url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleToggleFavorite = (game: Game) => {
    const updatedGame = { ...game, isFavorite: !game.isFavorite };
    PersistenceManager.updateGame(updatedGame);
    window.location.reload();
  };

  const handleDeleteGame = (game: Game) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el partido entre ${game.teamHome.name} y ${game.teamAway.name}? Esta acción no se puede deshacer.`)) {
      PersistenceManager.deleteGame(game.id);
      window.location.reload();
    }
  };

  const renderJuegos = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="max-w-3xl mt-4">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-2">Resumen General</p>
          <h2 className="font-contrail text-6xl md:text-8xl text-white italic tracking-wide mb-6 drop-shadow-lg">PANEL DE JUEGOS</h2>
        </div>
        <div className="border-l-2 border-[#b4b4b4]/50 pl-5 py-1 mb-6 animate-stagger" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-sm md:text-base leading-relaxed max-w-2xl">
            Controla tu cronograma de partidos, organiza próximos encuentros y repasa los resultados recientes con un clic.
          </p>
        </div>
      </div>

      {/* Indicador de Consumo (Solo para usuarios FREE) */}
      {(user.plan === 'free' || !user.plan) && (
        <div className="mb-6 p-5 rounded-2xl bg-[#131041]/90 border border-yellow-500/25 max-w-3xl shadow-xl relative overflow-hidden animate-stagger" style={{ animationDelay: '150ms' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider">
                  Plan Free — Partidos en este ciclo
                </p>
                {user.cycleStartDate && (
                  <p className="text-[10px] text-white/50 font-bold uppercase mt-0.5">
                    Tu cuota se renovará el {new Date(user.cycleStartDate + 30 * 24 * 60 * 60 * 1000).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-contrail text-xl text-white italic">
                {user.matchesCreatedInCycle || 0} <span className="text-white/40 font-lato font-normal not-italic text-sm">/ 4</span>
              </span>
            </div>
          </div>

          <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (user.matchesCreatedInCycle || 0) >= 4 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : 'bg-gradient-to-r from-yellow-500 to-amber-400'
              }`}
              style={{ width: `${Math.min(100, ((user.matchesCreatedInCycle || 0) / 4) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mt-4 mb-4">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-5 flex flex-col h-[200px] shadow-2xl overflow-y-auto no-scrollbar animate-stagger" style={{ animationDelay: '200ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left"></i> Últimos Juegos
            </p>
            <div className="space-y-3">
              {matches.slice(-3).reverse().map((g) => (
                <GameAccordion key={g.id} g={g} onStats={() => navigate(`/summary/${g.id}`)} onShare={() => handleShare(g)} onRecycle={() => setShowRecycleModal(g)} onFavorite={() => handleToggleFavorite(g)} onDelete={() => handleDeleteGame(g)} />
              ))}
              {matches.length === 0 && <p className="text-[11px] text-white/40 italic p-4 text-center">Sin registros disponibles.</p>}
            </div>
          </div>

          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-5 flex flex-col h-[200px] shadow-2xl overflow-y-auto no-scrollbar animate-stagger" style={{ animationDelay: '300ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <i className="fa-solid fa-calendar-days"></i> Agenda Próxima
            </p>
            <div className="space-y-3">
              {[{ r: 'Lions Club', d: '24/05' }, { r: 'Tigres HC', d: '28/05' }].map((g, i) => (
                <div key={i} className="group/agenda relative flex items-center justify-between bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all overflow-hidden">
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest shrink-0 w-10 text-center">{g.d}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 bg-black/40 px-3 py-2 rounded-lg">
                      <span className="truncate flex-1 text-white text-[11px] font-bold uppercase tracking-tighter">vs {g.r}</span>
                      <span className="text-[9px] font-black text-[#b4b4b4] px-2.5 py-1 rounded-md leading-none shrink-0 bg-[#b4b4b4]/10">PENDIENTE</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover/agenda:opacity-100 transition-opacity duration-200 shrink-0 items-center px-2">
                    <button className="hover:scale-125 transition-transform text-white/50 hover:text-white" title="Editar"><i className="fa-solid fa-pen"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full xl:w-auto shrink-0 justify-end animate-stagger" style={{ animationDelay: '400ms' }}>
          <button
            onClick={() => navigate('/new-game')}
            className="bg-[#b4b4b4] text-black px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#c0c0c0] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(180,180,180,0.2)]"
          >
            INICIAR NUEVO <i className="fa-solid fa-arrow-right"></i>
          </button>
          <button onClick={() => navigate('/history')} className="bg-[#1a1c23] text-white border border-white/5 px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#252830] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto">
            VER HISTORIAL <i className="fa-solid fa-chevron-right text-white/40"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEquipo = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="max-w-3xl mt-4">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-2">Plantilla Activa</p>
          <h2 className="font-contrail text-6xl md:text-8xl text-white italic tracking-wide mb-6 drop-shadow-lg">MI EQUIPO</h2>
        </div>
        <div className="border-l-2 border-[#b4b4b4]/50 pl-5 py-1 mb-6 animate-stagger" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-sm md:text-base leading-relaxed max-w-2xl">
            Administra los perfiles de tus jugadores, ajusta dorsales y mantén la información de tu plantilla actualizada para un mejor rendimiento táctico.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mt-4 mb-4">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-6 flex flex-col justify-center h-[160px] shadow-2xl animate-stagger" style={{ animationDelay: '200ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-user-check"></i> Jugadores Registrados
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <h4 className="text-6xl font-contrail text-white leading-none">{PersistenceManager.loadStateLocal().players?.length || 0}</h4>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">En Plantilla</span>
            </div>
          </div>
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-6 flex flex-col justify-center h-[160px] shadow-2xl animate-stagger" style={{ animationDelay: '300ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-bolt"></i> Estado
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <h4 className="text-6xl font-contrail text-[#b4b4b4] leading-none">{PersistenceManager.loadStateLocal().players?.length || 0}</h4>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Activos</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full xl:w-auto shrink-0 justify-end animate-stagger" style={{ animationDelay: '400ms' }}>
          <button disabled className="bg-[#b4b4b4]/50 text-black/50 px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] cursor-not-allowed flex items-center justify-center gap-3 w-full sm:w-auto">
            AÑADIR JUGADOR <i className="fa-solid fa-arrow-right"></i>
          </button>
          <button disabled className="bg-[#1a1c23] text-white/50 border border-white/5 px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] cursor-not-allowed flex items-center justify-center gap-3 w-full sm:w-auto">
            VER PLANTILLA <i className="fa-solid fa-chevron-right text-white/20"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEstadisticas = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="max-w-3xl mt-4">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-2">Análisis de Desempeño</p>
          <h2 className="font-contrail text-6xl md:text-8xl text-white italic tracking-wide mb-6 drop-shadow-lg">ESTADÍSTICAS</h2>
        </div>
        <div className="border-l-2 border-[#b4b4b4]/50 pl-5 py-1 mb-6 animate-stagger" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-sm md:text-base leading-relaxed max-w-2xl">
            Métricas avanzadas para evaluar el rendimiento, eficiencia de pases y la evolución ofensiva de tu equipo basada en datos reales.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mt-4 mb-4">
        <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-5 flex flex-col justify-center shadow-2xl animate-stagger" style={{ animationDelay: '200ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-link"></i> Cadenas Prom.
            </p>
            <h4 className="text-4xl font-contrail text-white">{statsData.avgChains}</h4>
          </div>
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-5 flex flex-col justify-center shadow-2xl animate-stagger" style={{ animationDelay: '300ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-futbol"></i> Goles Totales
            </p>
            <h4 className="text-4xl font-contrail text-white">{statsData.totalGoals}</h4>
          </div>
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-5 flex flex-col justify-center col-span-2 md:col-span-1 shadow-2xl animate-stagger" style={{ animationDelay: '400ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-chart-line"></i> Evolución Ofensiva
            </p>
            <div className="w-full h-12 mt-2">
              {statsData.sparklineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsData.sparklineData}>
                    <Line type="monotone" dataKey="val" stroke="#b4b4b4" strokeWidth={3} dot={false} isAnimationActive={true} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center border border-white/10 rounded-lg border-dashed">
                  <span className="text-[9px] text-white/30 font-bold uppercase">Sin datos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full xl:w-auto shrink-0 justify-end animate-stagger" style={{ animationDelay: '500ms' }}>
          <button onClick={() => navigate('/trends')} className="bg-[#b4b4b4] text-black px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#c0c0c0] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(180,180,180,0.2)]">
            REPORTE COMPLETO <i className="fa-solid fa-arrow-right"></i>
          </button>
          <button className="bg-[#1a1c23] text-white border border-white/5 px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#252830] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto">
            EXPORTAR DATA <i className="fa-solid fa-download text-white/40"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAjustes = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="max-w-3xl mt-4">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-2">Sistema Operativo</p>
          <h2 className="font-contrail text-6xl md:text-8xl text-white italic tracking-wide mb-6 drop-shadow-lg">CONFIGURACIÓN</h2>
        </div>
        <div className="border-l-2 border-[#b4b4b4]/50 pl-5 py-1 mb-6 animate-stagger" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-sm md:text-base leading-relaxed max-w-2xl">
            Modifica los parámetros reglamentarios del deporte, tiempos de juego y administra tus listas de distribución para envíos automáticos.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mt-4 mb-4">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-6 flex flex-col justify-center h-[160px] shadow-2xl animate-stagger" style={{ animationDelay: '200ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-stopwatch"></i> Formato de Juego
            </p>
            <p className="text-2xl font-contrail text-white mt-2">4 Cuartos • 15 min</p>
          </div>
          <div className="bg-[#131041]/90 border border-white/5 rounded-xl p-6 flex flex-col justify-center h-[160px] shadow-2xl animate-stagger" style={{ animationDelay: '300ms' }}>
            <p className="text-[#b4b4b4] text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <i className="fa-solid fa-address-book"></i> Listas Activas
            </p>
            <h4 className="text-5xl font-contrail text-white mt-2">4</h4>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full xl:w-auto shrink-0 justify-end animate-stagger" style={{ animationDelay: '400ms' }}>
          <button
            onClick={seedFirestore}
            disabled={seedingStatus !== null}
            className={`px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto shadow-md ${
              seedingStatus?.includes('éxito') 
                ? 'bg-[#00fe00] text-black hover:bg-[#02e002]'
                : seedingStatus?.includes('Error') 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary text-white hover:bg-brandDark'
            }`}
          >
            {seedingStatus || 'SEMBRAR CONFIG DEPORTES (FIRESTORE)'} <i className="fa-solid fa-cloud-arrow-up"></i>
          </button>
          <button className="bg-[#b4b4b4] text-black px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#c0c0c0] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto shadow-[0_0_20px_rgba(180,180,180,0.2)]">
            REGLAMENTO <i className="fa-solid fa-arrow-right"></i>
          </button>
          <button className="bg-[#1a1c23] text-white border border-white/5 px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#252830] transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto">
            CONTACTOS <i className="fa-solid fa-chevron-right text-white/40"></i>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-[100dvh] relative flex flex-col md:flex-row overflow-hidden font-lato">

      <nav className="relative z-20 flex md:flex-col justify-around md:justify-start items-center bg-black/50 backdrop-blur-xl md:w-[240px] md:min-w-[240px] md:h-full w-full h-20 order-2 md:order-1 border-t md:border-t-0 md:border-r border-white/10 shrink-0 md:pt-0 md:px-3 md:gap-2 pb-2 md:pb-8">
        <div className="hidden md:flex justify-center items-center w-full py-8 px-6 mb-4 border-b border-white/5 shrink-0 opacity-100">
          <img src="./assets/logoLargoSN.svg" alt="MatchPad" className="w-full max-w-[200px] h-auto object-contain opacity-100" style={{ filter: 'drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.8)) drop-shadow(0px 0px 16px rgba(255, 255, 255, 0.5))', fill: 'initial', stroke: 'initial' }} />
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              flex transition-all duration-300 items-center
              flex-col justify-center gap-1 w-16 h-14 rounded-2xl
              ${activeSection === item.id 
                ? 'bg-white/20 text-white shadow-inner border border-white/20 scale-105' 
                : 'text-[#b4b4b4] hover:bg-white/10 opacity-60 hover:opacity-100'
              }
              md:flex-row md:justify-start md:w-full md:h-12 md:px-4 md:py-3 md:rounded-xl md:gap-4 md:scale-100 md:opacity-100 md:shadow-none md:border-0
              ${activeSection === item.id
                ? 'md:bg-gradient-to-r md:from-cyan-500/20 md:to-cyan-500/5 md:border-l-4 md:border-cyan-400 md:text-white md:pl-3 md:rounded-l-none'
                : 'md:bg-transparent md:border-l-4 md:border-transparent md:text-white/70 md:hover:bg-gradient-to-r md:hover:from-cyan-500/10 md:hover:to-transparent md:hover:text-white'
              }
            `}
          >
            <span className="text-xl md:text-lg drop-shadow-md flex items-center justify-center shrink-0 w-5">
              {item.icon}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest hidden md:block md:text-[16px] md:font-bold md:font-lato md:normal-case md:tracking-normal md:text-inherit">
              {item.label}
            </span>
          </button>
        ))}
        <div className="hidden md:block flex-1"></div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col order-1 md:order-2 overflow-hidden p-4 md:p-6 pb-2 md:pb-6 gap-4">

        <header className="flex justify-between items-center shrink-0 mb-2">
          <div className="md:hidden opacity-90">
            <img src="./assets/logoLargoSN.svg" alt="Logo" className="h-8 object-contain filter invert drop-shadow-md" />
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4 bg-[#1a1a1a] px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-black text-white leading-none tracking-wide">{user.name}</p>
              <p className="text-[9px] text-white/50 uppercase font-black mt-1 tracking-[2px]">{user.role}</p>
            </div>
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-circle-user text-3xl text-white/80"></i>
            </div>
            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>
            <button
              onClick={onLogout}
              className="text-white/50 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-white/5 group"
              title="Cerrar Sesión"
            >
              <i className="fa-solid fa-right-from-bracket text-lg group-hover:-translate-x-0.5 transition-transform"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 p-2 md:p-4 overflow-y-auto no-scrollbar relative flex flex-col">
          {activeSection === 'juegos' && renderJuegos()}
          {activeSection === 'equipo' && renderEquipo()}
          {activeSection === 'estadisticas' && renderEstadisticas()}
          {activeSection === 'ajustes' && renderAjustes()}
        </div>

      </main>

      {showRecycleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 text-3xl mb-6">
              <i className="fa-solid fa-rotate-right"></i>
            </div>
            <h3 className="font-contrail text-xl text-white tracking-wide mb-2">Reutilizar Partido</h3>
            <p className="text-[12px] text-white/70 font-lato mb-8 leading-relaxed">
              ¿Deseas generar un nuevo juego con los equipos <span className="text-white font-black">{showRecycleModal.teamHome.name}</span> y <span className="text-white font-black">{showRecycleModal.teamAway.name}</span>?
              <br /><br />
              Se mantendrán los colores y configuraciones, pero el marcador y eventos se reiniciarán.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={() => { handleRecycle(showRecycleModal); setShowRecycleModal(null); }} className="w-full bg-primary text-white font-bold py-4 rounded-2xl active:scale-95 text-[10px] uppercase tracking-widest shadow-lg hover:bg-brandDark transition-colors">
                Sí, Generar Nuevo
              </button>
              <button onClick={() => setShowRecycleModal(null)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-colors border border-white/10">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default DashboardView;
