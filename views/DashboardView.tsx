import React, { useMemo } from 'react';
import { UserRole, Game, TacticalScheme } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const getSportIcon = (sportId?: string) => {
  switch (sportId) {
    case 'futbol':
      return <i className="fa-solid fa-futbol text-white/50 text-[10px] mt-0.5" title="Fútbol"></i>;
    case 'voley':
      return <i className="fa-solid fa-volleyball text-white/50 text-[10px] mt-0.5" title="Vóley"></i>;
    case 'basket':
      return <i className="fa-solid fa-basketball text-white/50 text-[10px] mt-0.5" title="Básquet"></i>;
    case 'hockey_cesped':
    default:
      return <i className="fa-solid fa-hockey-puck text-white/50 text-[10px] mt-0.5" title="Hockey"></i>;
  }
};

const GameAccordion: React.FC<{ g: Game, isPressMode?: boolean, onStats: () => void, onShare: () => void, onRecycle: () => void, onFavorite: () => void, onDelete: () => void }> = ({ g, isPressMode, onStats, onShare, onRecycle, onFavorite, onDelete }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden transition-all duration-300 group/accordion">
      <div
        className="flex items-center justify-between p-2 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest shrink-0 w-10 text-center flex flex-col items-center justify-center">
            <span>{new Date(g.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}</span>
            {isPressMode && getSportIcon(g.sportId || g.sportType)}
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
          className="text-white/50 hover:text-white px-2 py-1 rounded-full transition-all flex items-center justify-center shrink-0 opacity-0 group-hover/accordion:opacity-100 duration-200"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          <i className="fa-solid fa-ellipsis-vertical text-white/70"></i>
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

const BentoGameCard: React.FC<{
  g: Game;
  isPressMode?: boolean;
  onStats: () => void;
  onShare: () => void;
  onRecycle: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}> = ({ g, isPressMode, onStats, onShare, onRecycle, onFavorite, onDelete }) => {
  const dateStr = new Date(g.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 group-hover:bg-[#c6ff00]/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-check text-[#c6ff00]"></i> {dateStr}
            </span>
            {isPressMode && (
              <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/15 text-[11px]">
                {getSportIcon(g.sportId || g.sportType)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              g.isFavorite
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                : 'bg-white/10 text-white/40 hover:text-yellow-400 hover:bg-white/20 border border-white/15'
            }`}
            title={g.isFavorite ? 'Quitar de Favoritos' : 'Marcar Favorito'}
          >
            <i className="fa-solid fa-star text-xs"></i>
          </button>
        </div>

        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-4 flex items-center justify-between gap-2">
          <div className="flex-1 text-center min-w-0 pr-1">
            <p className="text-xs md:text-sm font-bold text-white truncate leading-snug" title={g.teamHome.name}>
              {g.teamHome.name}
            </p>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Local</span>
          </div>

          <div className="bg-white/10 text-white border border-white/15 px-3.5 py-1.5 rounded-full text-center shrink-0 shadow-inner">
            <span className="text-sm md:text-base font-black font-contrail text-white tracking-widest">
              {g.scoreHome} - {g.scoreAway}
            </span>
          </div>

          <div className="flex-1 text-center min-w-0 pl-1">
            <p className="text-xs md:text-sm font-bold text-white truncate leading-snug" title={g.teamAway.name}>
              {g.teamAway.name}
            </p>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Visita</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-1 mt-1">
        <button
          onClick={onStats}
          className="flex-1 py-2 px-2 rounded-xl bg-[#c6ff00]/10 hover:bg-[#c6ff00]/20 border border-[#c6ff00]/25 text-[#c6ff00] font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 group/btn"
          title="Ver Resumen y Estadísticas"
        >
          <i className="fa-solid fa-chart-pie text-xs group-hover/btn:scale-110 transition-transform"></i>
          <span>Resumen</span>
        </button>

        <button
          onClick={onRecycle}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center shrink-0"
          title="Reutilizar Configuración"
        >
          <i className="fa-solid fa-rotate-right text-xs"></i>
        </button>

        <button
          onClick={onShare}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center shrink-0"
          title="Compartir Partido"
        >
          <i className="fa-solid fa-share-nodes text-xs"></i>
        </button>

        <button
          onClick={onDelete}
          className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all flex items-center justify-center shrink-0"
          title="Eliminar Partido"
        >
          <i className="fa-solid fa-trash-can text-xs"></i>
        </button>
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
  const location = useLocation();

  const getInitialSection = (): SectionId => {
    const searchParams = new URLSearchParams(location.search);
    const target = (searchParams.get('section') || (location.state as any)?.section) as SectionId;
    if (target && NAV_ITEMS.some(item => item.id === target)) {
      return target;
    }
    return 'juegos';
  };

  const [activeSection, setActiveSection] = React.useState<SectionId>(getInitialSection);
  const [showRecycleModal, setShowRecycleModal] = React.useState<Game | null>(null);
  const [showReglamentosModal, setShowReglamentosModal] = React.useState<boolean>(false);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const target = (searchParams.get('section') || (location.state as any)?.section) as SectionId;
    if (target && NAV_ITEMS.some(item => item.id === target)) {
      setActiveSection(target);
    }
    const sub = searchParams.get('sub') || (location.state as any)?.subSection;
    if (sub === 'reglamentos') {
      setShowReglamentosModal(true);
    }
  }, [location.search, location.state]);

  const scheduledMatches = useMemo(() => matches.filter(m => m.status === 'scheduled'), [matches]);
  const playedMatches = useMemo(() => matches.filter(m => m.status !== 'scheduled'), [matches]);

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

  const squadPlayers = useMemo(() => PersistenceManager.loadStateLocal().players || [], []);
  const lastRegisteredPlayers = useMemo(() => (squadPlayers || []).slice(-5).reverse(), [squadPlayers]);

  const advancedStats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let totalHomeEvents = 0;
    let totalEvents = 0;

    playedMatches.forEach(m => {
      const sh = m.scoreHome || 0;
      const sa = m.scoreAway || 0;
      goalsFor += sh;
      goalsAgainst += sa;
      if (sh > sa) {
        wins++;
      } else if (sh === sa) {
        draws++;
      } else {
        losses++;
      }

      if (m.events) {
        m.events.forEach(e => {
          totalEvents++;
          if (e.teamId === m.teamHome.id) totalHomeEvents++;
        });
      }
    });

    const recordStr = `${wins}-${draws}-${losses}`;
    const goalDiff = goalsFor - goalsAgainst;
    const goalDiffStr = goalDiff > 0 ? `+${goalDiff}` : `${goalDiff}`;
    const possessionPct = totalEvents > 0
      ? Math.round((totalHomeEvents / totalEvents) * 100)
      : (playedMatches.length > 0 ? 52 : 0);

    return {
      wins,
      draws,
      losses,
      recordStr,
      possessionPct,
      goalsFor,
      goalsAgainst,
      goalDiff,
      goalDiffStr
    };
  }, [playedMatches]);

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
    <div className="flex flex-col h-full justify-start gap-6 pb-2">
      <div className="w-full max-w-none mt-2">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-1">Resumen General</p>
          <h2 className="font-display font-black text-3xl md:text-5xl text-white uppercase tracking-tight mb-3 drop-shadow-lg">PANEL DE JUEGOS</h2>
        </div>
        <div className="border-l-2 border-white/20 pl-4 py-1 mb-4 animate-stagger w-full max-w-none" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-xs md:text-sm leading-relaxed w-full">
            Controla tu cronograma de partidos, organiza próximos encuentros y repasa los resultados recientes con un clic.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL DE JUEGOS CON CTAS INTERNOS Y BENTOGRID DE ULTIMOS JUEGOS */}
      <div className="bg-[#1c1236]/80 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all animate-stagger" style={{ animationDelay: '150ms' }}>
        
        {/* Header de la Card con los 3 CTAs en la misma fila */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00] text-lg shadow-inner">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <h3 className="font-contrail text-xl md:text-2xl font-black tracking-wider uppercase italic text-white leading-none">
                Últimos Juegos Guardados
              </h3>
              <p className="text-[11px] text-white/50 font-lato mt-1">Resultados e historial de encuentros</p>
            </div>
          </div>

          {/* TRES CTAS EN LA MISMA FILA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
            {/* CTA Secundario 1 */}
            <button
              onClick={() => navigate('/history')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-list-check text-xs"></i>
              <span>Ver Historial de Juegos</span>
            </button>

            {/* CTA Secundario 2 (Igual al primero) */}
            <button
              onClick={() => navigate('/new-game?mode=schedule')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-calendar-days text-xs text-[#c6ff00]"></i>
              <span>Acceder a Agenda</span>
            </button>

            {/* CTA Primario 3 (Destacado en color primario a la derecha) */}
            <button
              onClick={() => navigate('/new-game')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#c6ff00] text-[#0c0f17] hover:bg-[#b5eb00] font-black text-[11px] uppercase tracking-wider font-contrail italic transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] shadow-[0_0_20px_rgba(198,255,0,0.35)] hover:shadow-[0_0_30px_rgba(198,255,0,0.55)]"
            >
              <i className="fa-solid fa-circle-plus text-xs text-[#0c0f17]"></i>
              <span>Iniciar Nuevo Juego</span>
            </button>
          </div>
        </div>

        {/* BENTOGRID DE ULTIMOS JUEGOS (Horizontal en pantallas grandes, apilable en chicas) */}
        {playedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {playedMatches.slice(-6).reverse().map((g) => (
              <BentoGameCard
                key={g.id}
                g={g}
                isPressMode={user.role === UserRole.PRESS}
                onStats={() => navigate(`/summary/${g.id}`)}
                onShare={() => handleShare(g)}
                onRecycle={() => setShowRecycleModal(g)}
                onFavorite={() => handleToggleFavorite(g)}
                onDelete={() => handleDeleteGame(g)}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 text-xl mb-3">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <p className="text-sm font-bold text-white/70">No hay juegos guardados todavía</p>
            <p className="text-xs text-white/40 mt-1 max-w-sm">Inicia un nuevo juego o revisa el historial para cargar datos.</p>
          </div>
        )}

      </div>
    </div>
  );

  const renderEquipo = () => (
    <div className="flex flex-col h-full justify-start gap-6 pb-2">
      <div className="w-full max-w-none mt-2">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-1">Plantilla Activa</p>
          <h2 className="font-display font-black text-3xl md:text-5xl text-white uppercase tracking-tight mb-3 drop-shadow-lg">MI EQUIPO</h2>
        </div>
        <div className="border-l-2 border-white/20 pl-4 py-1 mb-4 animate-stagger w-full max-w-none" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-xs md:text-sm leading-relaxed w-full">
            Administra los perfiles de tus jugadores, ajusta dorsales y mantén la información de tu plantilla actualizada para un mejor rendimiento táctico.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL DE EQUIPO CON CTAS Y BENTOGRID */}
      <div className="bg-[#1c1236]/80 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all animate-stagger" style={{ animationDelay: '150ms' }}>
        
        {/* Header de la Card con título, descripción y los 3 CTAs a la derecha */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00] text-lg shadow-inner">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <h3 className="font-contrail text-xl md:text-2xl font-black tracking-wider uppercase italic text-white leading-none">
                Jugadores Registrados
              </h3>
              <p className="text-[11px] text-white/50 font-lato mt-1">Gestión integral de plantilla y dorsales</p>
            </div>
          </div>

          {/* TRES CTAS EN LA MISMA FILA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
            {/* CTA Secundario 1: Gestionar Equipos */}
            <button
              onClick={() => navigate('/squad')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-shield-halved text-xs text-[#c6ff00]"></i>
              <span>Gestionar Equipos</span>
            </button>

            {/* CTA Secundario 2: Gestionar Dorsales */}
            <button
              onClick={() => navigate('/squad')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-shirt text-xs text-[#a5b4fc]"></i>
              <span>Gestionar Dorsales</span>
            </button>

            {/* CTA Primario 3: Gestionar Plantel */}
            <button
              onClick={() => navigate('/squad')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#c6ff00] text-[#0c0f17] hover:bg-[#b5eb00] font-black text-[11px] uppercase tracking-wider font-contrail italic transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] shadow-[0_0_20px_rgba(198,255,0,0.35)] hover:shadow-[0_0_30px_rgba(198,255,0,0.55)]"
            >
              <i className="fa-solid fa-user-gear text-xs text-[#0c0f17]"></i>
              <span>Gestionar Plantel</span>
            </button>
          </div>
        </div>

        {/* BENTOGRID DE EQUIPO CON DOS CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Cantidad de jugadores registrados */}
          <div className="lg:col-span-4 group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 group-hover:bg-[#c6ff00]/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-id-card text-[#c6ff00]"></i> Total Plantilla
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#c6ff00]/10 text-[#c6ff00] border border-[#c6ff00]/25 text-xs">
                <i className="fa-solid fa-user-check"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className="text-6xl md:text-7xl font-contrail font-black text-white leading-none tracking-tight">
                {squadPlayers.length}
              </span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-3">
                Jugadores Registrados
              </span>
            </div>
          </div>

          {/* Card 2: Últimos 5 ingresados en la base con nombre, apellido y número */}
          <div className="lg:col-span-8 group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-start hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 group-hover:bg-purple-500/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-[#c6ff00]"></i> Últimos Ingresos
              </span>
            </div>

            <div className="space-y-2 flex-1">
              {lastRegisteredPlayers.length > 0 ? (
                lastRegisteredPlayers.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between p-2.5 px-3.5 bg-black/30 hover:bg-white/5 border border-white/10 rounded-2xl transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-inner">
                        #{p.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-bold text-white truncate leading-tight">
                          {p.name}
                        </p>
                        {p.comments && (
                          <p className="text-[10px] text-white/40 truncate mt-0.5">{p.comments}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#c6ff00] bg-[#c6ff00]/10 border border-[#c6ff00]/25 px-2.5 py-1 rounded-full shrink-0">
                      Dorsal {p.number}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
                  <i className="fa-solid fa-user-plus text-white/30 text-xl mb-2"></i>
                  <p className="text-xs font-bold text-white/60">No hay jugadores registrados todavía</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderEstadisticas = () => (
    <div className="flex flex-col h-full justify-start gap-6 pb-2">
      <div className="w-full max-w-none mt-2">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-1">Análisis de Desempeño</p>
          <h2 className="font-display font-black text-3xl md:text-5xl text-white uppercase tracking-tight mb-3 drop-shadow-lg">ESTADÍSTICAS</h2>
        </div>
        <div className="border-l-2 border-white/20 pl-4 py-1 mb-4 animate-stagger w-full max-w-none" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-xs md:text-sm leading-relaxed w-full">
            Métricas avanzadas para evaluar el rendimiento, eficiencia de pases y la evolución ofensiva de tu equipo basada en datos reales.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL DE ESTADÍSTICAS CON CTAS Y BENTOGRID */}
      <div className="bg-[#1c1236]/80 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all animate-stagger" style={{ animationDelay: '150ms' }}>
        
        {/* Header de la Card con título, descripción y los 3 CTAs a la derecha */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00] text-lg shadow-inner">
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            <div>
              <h3 className="font-contrail text-xl md:text-2xl font-black tracking-wider uppercase italic text-white leading-none">
                Índices Principales
              </h3>
              <p className="text-[11px] text-white/50 font-lato mt-1">Métricas generales de desempeño y balance competitivo</p>
            </div>
          </div>

          {/* TRES CTAS EN LA MISMA FILA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
            {/* CTA Secundario 1: Índices del Equipo */}
            <button
              onClick={() => navigate('/trends')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-shield-halved text-xs text-[#c6ff00]"></i>
              <span>Índices del Equipo</span>
            </button>

            {/* CTA Secundario 2: Índices por Jugador */}
            <button
              onClick={() => navigate('/squad')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-user text-xs text-[#a5b4fc]"></i>
              <span>Índices por Jugador</span>
            </button>

            {/* CTA Primario 3: Índices Globales */}
            <button
              onClick={() => navigate('/trends')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#c6ff00] text-[#0c0f17] hover:bg-[#b5eb00] font-black text-[11px] uppercase tracking-wider font-contrail italic transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] shadow-[0_0_20px_rgba(198,255,0,0.35)] hover:shadow-[0_0_30px_rgba(198,255,0,0.55)]"
            >
              <i className="fa-solid fa-chart-line text-xs text-[#0c0f17]"></i>
              <span>Índices Globales</span>
            </button>
          </div>
        </div>

        {/* BENTOGRID DE 3 CARDS HIJAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Récord (x-x-x) */}
          <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 group-hover:bg-yellow-500/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-yellow-400"></i> Récord
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs">
                <i className="fa-solid fa-award"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className="text-5xl md:text-6xl font-contrail font-black text-white leading-none tracking-tight">
                {advancedStats.recordStr}
              </span>
              <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-white/50 uppercase tracking-widest">
                <span>{advancedStats.wins} Ganados</span>
                <span>•</span>
                <span>{advancedStats.draws} Empatados</span>
                <span>•</span>
                <span>{advancedStats.losses} Perdidos</span>
              </div>
            </div>
          </div>

          {/* Card 2: Porcentaje de Posesión */}
          <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 group-hover:bg-[#c6ff00]/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-arrows-spin text-[#c6ff00]"></i> Porcentaje de Posesión
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#c6ff00]/10 text-[#c6ff00] border border-[#c6ff00]/25 text-xs">
                <i className="fa-solid fa-chart-simple"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className="text-5xl md:text-6xl font-contrail font-black text-white leading-none tracking-tight">
                {advancedStats.possessionPct}%
              </span>
              <div className="w-full max-w-[160px] bg-white/10 h-2 rounded-full overflow-hidden mt-3 p-0.5">
                <div
                  className="bg-gradient-to-r from-[#c6ff00] to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, advancedStats.possessionPct))}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-2">
                Promedio de Dominio
              </span>
            </div>
          </div>

          {/* Card 3: Diferencia de Goleo */}
          <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-futbol text-emerald-400"></i> Diferencia de Goleo
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                <i className="fa-solid fa-scale-balanced"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className={`text-5xl md:text-6xl font-contrail font-black leading-none tracking-tight ${advancedStats.goalDiff >= 0 ? 'text-[#c6ff00]' : 'text-red-400'}`}>
                {advancedStats.goalDiffStr}
              </span>
              <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-white/50 uppercase tracking-widest">
                <span>{advancedStats.goalsFor} A Favor</span>
                <span>•</span>
                <span>{advancedStats.goalsAgainst} En Contra</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderAjustes = () => (
    <div className="flex flex-col h-full justify-start gap-6 pb-2">
      <div className="w-full max-w-none mt-2">
        <div className="animate-stagger" style={{ animationDelay: '0ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-bold tracking-[3px] uppercase mb-1">Sistema Operativo</p>
          <h2 className="font-display font-black text-3xl md:text-5xl text-white uppercase tracking-tight mb-3 drop-shadow-lg">CONFIGURACIÓN</h2>
        </div>
        <div className="border-l-2 border-white/20 pl-4 py-1 mb-4 animate-stagger w-full max-w-none" style={{ animationDelay: '100ms' }}>
          <p className="font-lato text-white/70 text-xs md:text-sm leading-relaxed w-full">
            Modifica los parámetros reglamentarios del deporte, tiempos de juego y administra tus listas de distribución para envíos automáticos.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL DE AJUSTES CON CTAS Y BENTOGRID */}
      <div className="bg-[#1c1236]/80 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all animate-stagger" style={{ animationDelay: '150ms' }}>
        
        {/* Header de la Card con título, descripción y los 3 CTAs a la derecha */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00] text-lg shadow-inner">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h3 className="font-contrail text-xl md:text-2xl font-black tracking-wider uppercase italic text-white leading-none">
                Sala de Control
              </h3>
              <p className="text-[11px] text-white/50 font-lato mt-1">Reglamentación deportiva, listas de difusión y perfil</p>
            </div>
          </div>

          {/* TRES CTAS EN LA MISMA FILA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
            {/* CTA Secundario 1: Gestionar Reglamentos */}
            <button
              onClick={() => setShowReglamentosModal(true)}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-book-bookmark text-xs text-[#c6ff00]"></i>
              <span>Gestionar Reglamentos</span>
            </button>

            {/* CTA Secundario 2: Gestionar Difusión */}
            <button
              onClick={() => alert('Gestión de Listas de Difusión')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <i className="fa-solid fa-bullhorn text-xs text-[#a5b4fc]"></i>
              <span>Gestionar Difusión</span>
            </button>

            {/* CTA Primario 3: Mi Perfil */}
            <button
              onClick={() => alert(`Perfil: ${user.name} (${user.role})`)}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#c6ff00] text-[#0c0f17] hover:bg-[#b5eb00] font-black text-[11px] uppercase tracking-wider font-contrail italic transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] shadow-[0_0_20px_rgba(198,255,0,0.35)] hover:shadow-[0_0_30px_rgba(198,255,0,0.55)]"
            >
              <i className="fa-solid fa-circle-user text-xs text-[#0c0f17]"></i>
              <span>Mi Perfil</span>
            </button>
          </div>
        </div>

        {/* BENTOGRID DE 2 CARDS HIJAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Reglas de Deportes */}
          <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 group-hover:bg-[#c6ff00]/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-stopwatch text-[#c6ff00]"></i> Reglas de Deportes
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#c6ff00]/10 text-[#c6ff00] border border-[#c6ff00]/25 text-xs">
                <i className="fa-solid fa-gamepad"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className="text-5xl md:text-6xl font-contrail font-black text-white leading-none tracking-tight">
                4
              </span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-3">
                Deportes Configurados
              </span>
              <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                <span>Fútbol</span>
                <span>•</span>
                <span>Hockey</span>
                <span>•</span>
                <span>Básquet</span>
                <span>•</span>
                <span>Vóley</span>
              </div>
            </div>
          </div>

          {/* Card 2: Listas de Difusión */}
          <div className="group relative bg-[#1c1236]/80 hover:bg-[#1c1236]/90 backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-3xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 group-hover:bg-purple-500/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] bg-white/10 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <i className="fa-solid fa-address-book text-purple-400"></i> Listas de Difusión
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">
                <i className="fa-solid fa-users-viewfinder"></i>
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 my-auto">
              <span className="text-5xl md:text-6xl font-contrail font-black text-white leading-none tracking-tight">
                3
              </span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-3">
                Listas Activas
              </span>
              <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-[#c6ff00] bg-[#c6ff00]/10 border border-[#c6ff00]/25 px-3 py-1 rounded-full">
                <i className="fa-solid fa-user-group text-[10px]"></i>
                <span>67 Miembros Totales</span>
              </div>
            </div>
          </div>
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
                ? 'md:bg-gradient-to-r md:from-[#c6ff00]/20 md:to-[#c6ff00]/5 md:border-l-4 md:border-[#c6ff00] md:text-white md:pl-3 md:rounded-l-none'
                : 'md:bg-transparent md:border-l-4 md:border-transparent md:text-white/70 md:hover:bg-gradient-to-r md:hover:from-[#c6ff00]/10 md:hover:to-transparent md:hover:text-white'
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

        {/* BLOQUE DE USUARIO Y LOGOUT AL FINAL DEL SIDEBAR IZQUIERDO */}
        <div className="hidden md:flex flex-col gap-3 p-4 mx-2 mb-2 bg-[#1c1236]/80 backdrop-blur-xl border border-white/30 rounded-3xl shrink-0 text-white w-[calc(100%-16px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-[#c6ff00] flex items-center justify-center shrink-0 shadow-md">
              <i className="fa-solid fa-user text-white text-sm"></i>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{user.name}</p>
              <p className="text-[9px] text-[#c6ff00] uppercase font-black tracking-wider mt-0.5">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/20 group"
            title="Cerrar Sesión"
          >
            <i className="fa-solid fa-right-from-bracket text-xs group-hover:-translate-x-0.5 transition-transform"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col order-1 md:order-2 overflow-hidden p-4 md:p-6 pb-2 md:pb-6">
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

      {showReglamentosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1c1236] border border-[#c6ff00]/30 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="w-16 h-16 bg-[#c6ff00]/10 border border-[#c6ff00]/30 rounded-2xl flex items-center justify-center text-[#c6ff00] text-2xl mb-4 shadow-inner">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c6ff00] bg-[#c6ff00]/10 border border-[#c6ff00]/20 px-3 py-1 rounded-full mb-2">
              Ajustes / Gestionar Reglamentos
            </span>
            <h3 className="font-contrail text-2xl text-white tracking-wide uppercase italic mb-2">
              Sección en Desarrollo
            </h3>
            <p className="text-xs text-white/70 font-lato mb-6 leading-relaxed">
              La interfaz para modificar y personalizar los parámetros y reglamentos aplicables al fixture por deporte aún se encuentra en construcción.
            </p>
            <button
              onClick={() => setShowReglamentosModal(false)}
              className="w-full bg-[#c6ff00] text-[#0c0f17] font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider font-contrail italic hover:bg-[#b5eb00] transition-colors shadow-[0_0_20px_rgba(198,255,0,0.3)] cursor-pointer"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}



    </div>
  );
};

export default DashboardView;
