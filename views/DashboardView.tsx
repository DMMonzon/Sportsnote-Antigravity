import React, { useMemo } from 'react';
import { UserRole, Game, TacticalScheme, Player } from '../types';


import { PersistenceManager } from '../services/PersistenceManager';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const TacticIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 4L8 8M8 4L4 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 16L20 20M20 16L16 20" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M6 19C6 19 7 13 15 13" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M13 10L16 13L13 16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="6" cy="19" r="2" fill="white" stroke="#94a3b8" strokeWidth="2" />
  </svg>
);

interface ActionCardProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  icon: React.ReactNode;
  bgIcon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, description, ctaText, icon, bgIcon, colorClass, onClick, disabled, children }) => (
  <div className={`relative overflow-hidden w-full rounded-[32px] p-5 md:p-6 lg:p-8 flex flex-col gap-4 lg:gap-6 transition-all shadow-2xl group ${colorClass}`}>
    {/* Decoración de fondo */}
    <div className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
      {bgIcon}
    </div>

    {/* FILA PRINCIPAL: Responsiva (Columna en móvil, Fila en tablet/desktop) */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10 w-full border-b border-white/10 pb-5 lg:pb-6">

      {/* Bloque 1: Identidad (Icono + Textos) */}
      <div className="flex flex-row items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
          {icon}
        </div>
        <div className="flex flex-col text-left">
          <p className="text-white/60 text-[9px] font-black uppercase tracking-[2px] leading-none mb-1">{subtitle}</p>
          <h3 className="text-white text-lg font-black leading-none tracking-tighter uppercase">{title}</h3>
        </div>
      </div>

      {/* Separador vertical (solo visible en desktop/tablet) */}
      <div className="hidden md:block w-px h-12 bg-white/20"></div>

      {/* Bloque 2: Descripción */}
      <div className="flex-1 md:px-4 mt-1 md:mt-0">
        <p className="text-white/80 text-[11px] font-medium leading-relaxed text-left max-w-2xl">
          {description}
        </p>
      </div>

      {/* Separador vertical (solo visible en desktop/tablet) */}
      <div className="hidden md:block w-px h-12 bg-white/20"></div>

      {/* Bloque 3: Botón de Acción Principal */}
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`w-full md:w-auto mt-2 md:mt-0 shrink-0 bg-white text-dark px-6 py-4 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brandDark hover:text-white active:scale-95'}`}
      >
        <span>{ctaText} {disabled && '(PRÓXIMAMENTE)'}</span>
        <span className="text-lg">→</span>
      </button>
    </div>

    {/* BLOQUE INFERIOR: Grid de Sub-Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 w-full">
      {children}
    </div>
  </div>
);

const GameAccordion = ({ g, onStats, onShare, onRecycle, onFavorite, onDelete }: { g: Game, onStats: () => void, onShare: () => void, onRecycle: () => void, onFavorite: () => void, onDelete: () => void }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="bg-black/20 hover:bg-black/30 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 group/accordion">
      {/* AccordionSummary */}
      <div 
        className="flex items-center justify-between p-1.5 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest shrink-0 w-8 text-center">
            {new Date(g.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
          </span>
          <div className="flex items-center justify-between gap-1.5 flex-1 min-w-0 bg-white/10 px-2 py-1.5 rounded-lg border border-white/5">
            <span className="truncate text-right flex-1 text-white text-[10px] font-bold">{g.teamHome.name}</span>
            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-md leading-none shrink-0 bg-black/40 shadow-inner flex items-center gap-1">
              {g.scoreHome} - {g.scoreAway}
              {g.isFavorite && <span className="text-yellow-400 text-[10px] drop-shadow-sm ml-0.5">⭐</span>}
            </span>
            <span className="truncate text-left flex-1 text-white text-[10px] font-bold">{g.teamAway.name}</span>
          </div>
        </div>
        <button 
          className="text-white/60 hover:text-white px-2 py-1 rounded-full transition-colors flex items-center justify-center shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* AccordionDetails */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-center gap-2 p-3 border-t border-white/10 bg-black/20">
            <button onClick={() => onStats()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
              <span className="text-lg leading-none">📊</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Estadísticas</span>
            </button>
            <button onClick={() => onRecycle()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
              <span className="text-lg leading-none">🔄</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Reutilizar</span>
            </button>
            <button onClick={() => onShare()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
              <span className="text-lg leading-none">🔗</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Compartir</span>
            </button>
            <button onClick={() => onFavorite()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
              <span className={`text-lg leading-none ${g.isFavorite ? 'text-yellow-400' : ''}`}>{g.isFavorite ? '⭐' : '☆'}</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">{g.isFavorite ? 'Quitar Favorito' : 'Favorito'}</span>
            </button>
            <button onClick={() => onDelete()} className="flex items-center justify-center gap-2 p-2.5 min-w-[44px] min-h-[44px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
              <span className="text-lg leading-none">🗑️</span>
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  user: {
    id: string;
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    avatar?: string;
  };
  matches: Game[];
  tacticalSchemes: TacticalScheme[];
  onUpdateTactics: (tactics: TacticalScheme[]) => void;
  onLogout: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, matches, tacticalSchemes, onUpdateTactics, onLogout }) => {
  const navigate = useNavigate();
  const [showRecycleModal, setShowRecycleModal] = React.useState<Game | null>(null);
  const [showTacticsModal, setShowTacticsModal] = React.useState(false); // Kept state to avoid breaking potential parent triggers, but will hide UI

  const [newTactic, setNewTactic] = React.useState({ name: '', description: '', objective: '' });



  const statsData = useMemo(() => {
    const allChains = matches.flatMap(g => g.passChains);
    const avgChains = allChains.length > 0
      ? (allChains.reduce((a, b) => a + b, 0) / allChains.length).toFixed(1)
      : "0.0";

    const goals = matches.flatMap(g => g.events).filter(e => e.type.includes('GOL'));
    const topScorer = goals.length > 0 ? `Jugador #${Math.floor(Math.random() * 20) + 1}` : "N/A";
    const totalGoals = goals.length > 0 ? goals.length : 0;

    // Sparkline data (last 3 matches)
    const sparklineData = matches.slice(-3).map(m => ({
      val: m.events.filter(e => e.type.includes('DISPARO') || e.type.includes('GOL')).length
    }));

    return { avgChains, topScorer, totalGoals, sparklineData };
  }, [matches]);

  const handleRecycle = (game: Game) => {
    navigate('/new-game', { state: { template: game } });
  };

  const handleShare = (game: Game) => {
    const text = `Resumen del partido: ${game.teamHome.name} ${game.scoreHome} - ${game.scoreAway} ${game.teamAway.name}\nVer más en SportNotes.`;
    const url = `${window.location.origin}/#/summary/${game.id}`;

    if (navigator.share) {
      navigator.share({
        title: 'SportNotes Match Summary',
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleToggleFavorite = (game: Game) => {
    const updatedGame = { ...game, isFavorite: !game.isFavorite };
    PersistenceManager.updateGame(updatedGame);
    // Since we're not using Redux or context right now for Dashboard `matches` prop, 
    // it's passed from App.tsx state. A true update requires dispatching to App, but
    // since PersistenceManager immediately sets localStorage, clicking the star might not visually 
    // update until refresh, or we need to trigger a re-render. 
    // The most robust way without prop drilling setMatches is location reload.
    window.location.reload();
  };

  const handleDeleteGame = (game: Game) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el partido entre ${game.teamHome.name} y ${game.teamAway.name}? Esta acción no se puede deshacer.`)) {
      PersistenceManager.deleteGame(game.id);
      window.location.reload();
    }
  };

  // Analytics for Area/23 entries (placeholder or logic cleanup if needed)


  return (
    <div className="min-h-screen w-full flex flex-col bg-surface overflow-y-auto no-scrollbar pb-16 relative">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-surfaceVariant px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center justify-center flex-1 md:flex-initial">
          <img
            src="./assets/logoLargoSN.svg"
            alt="SportNotes Logo"
            className="h-10 md:h-12 w-auto animate-in fade-in zoom-in duration-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black text-dark leading-none">{user.name}</p>
            <p className="text-[8px] text-onSurfaceVariant uppercase font-bold mt-0.5 tracking-tighter">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl border-2 border-primary/10 overflow-hidden shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <section className="flex justify-between items-end border-b border-surfaceVariant pb-4">
          <div>
            <h2 className="contrail-font text-3xl text-dark uppercase tracking-tighter">Panel de Control</h2>
            <p className="text-onSurfaceVariant font-bold text-[9px] uppercase tracking-[3px] opacity-60 mt-1">Status: Operacional • {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          {/* TARJETA 1: PANEL DE JUEGOS */}
          <ActionCard
            title="Panel de Juegos"
            subtitle={`${matches.length} registrados`}
            description="Controla el cronograma de tus juegos pasado y futuros, revisa sus estadísticas de manera individual y global, y realiza la comparación entre dos de ellos."
            ctaText="iniciar juego nuevo"
            colorClass="bg-primary shadow-primary/30"
            onClick={() => navigate('/new-game')}
            icon={<span className="text-2xl">🏟️</span>}
            bgIcon={<svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" /></svg>}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3 italic">Últimos 3 Juegos</p>
                <div className="space-y-2 mb-4">
                  {matches.slice(-3).reverse().map((g) => (
                    <GameAccordion
                      key={g.id}
                      g={g}
                      onStats={() => navigate(`/summary/${g.id}`)}
                      onShare={() => handleShare(g)}
                      onRecycle={() => setShowRecycleModal(g)}
                      onFavorite={() => handleToggleFavorite(g)}
                      onDelete={() => handleDeleteGame(g)}
                    />
                  ))}
                  {matches.length === 0 && <p className="text-[10px] text-white/40 italic">Sin registros disponibles.</p>}
                </div>
              </div>
              <button onClick={() => navigate('/history')} className="text-[9px] font-black text-white uppercase tracking-tighter hover:underline text-left opacity-80">ver historial completo</button>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3 italic">Agenda Próxima</p>
                <div className="space-y-2 mb-4">
                  {[{ r: 'Lions Club', d: '24/05' }, { r: 'Tigres HC', d: '28/05' }].map((g, i) => (
                    <div key={i} className="group/agenda relative flex items-center justify-between bg-black/20 hover:bg-black/40 border border-white/5 p-1.5 rounded-xl text-[10px] text-white font-bold transition-all overflow-hidden">
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-widest shrink-0 w-8 text-center">
                          {g.d}
                        </span>

                        <div className="flex items-center gap-2 flex-1 min-w-0 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="truncate flex-1 text-white uppercase tracking-tighter">vs {g.r}</span>
                          <span className="text-[8px] font-black text-white/50 px-2 py-0.5 rounded-md leading-none shrink-0 bg-black/40 shadow-inner">
                            PENDIENTE
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover/agenda:opacity-100 transition-opacity duration-200 shrink-0 h-full items-center px-2">
                        <button className="hover:scale-125 transition-transform text-lg" title="Editar">✏️</button>
                        <button className="hover:scale-125 transition-transform text-red-400 font-black text-base" title="Eliminar">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="text-[9px] font-black text-white uppercase tracking-tighter hover:underline text-left opacity-80">gestionar agenda</button>
            </div>
            {/* actionCard Panel Juegos */}
          </ActionCard>

          {/* TARJETA 2: GESTIÓN DE EQUIPO */}
          <ActionCard
            title="Gestión de Equipo"
            subtitle={`${PersistenceManager.loadStateLocal().players?.length || 0} jugadores`}
            description="Administra los perfiles de tus jugadores, gestiona dorsales y revisa la disponibilidad de tu plantilla en tiempo real."
            ctaText="gestionar mi plantel"
            colorClass="bg-emerald-800 shadow-emerald-900/40"
            onClick={() => navigate('/squad')}
            disabled={true}
            icon={<span className="text-2xl">👥</span>}

            bgIcon={<svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">Jugadores Registrados</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-white leading-none">{PersistenceManager.loadStateLocal().players?.length || 0}</h4>
                  <span className="text-[10px] font-bold text-white/40 uppercase">Activos</span>
                </div>
                <p className="text-[10px] font-bold text-white/70 uppercase mt-3 italic">
                  Personalizar mis jugadores
                </p>
              </div>
              <button
                disabled
                className="text-[9px] font-black text-white uppercase tracking-tighter mt-4 text-left opacity-50 cursor-not-allowed"
                title="Función disponible próximamente"
              >
                gestionar mi plantel (próximamente)
              </button>

            </div>
            {/* Tácticas Especiales card removed for MVP */}
          </ActionCard>



          {/* TARJETA 3: ESTADÍSTICAS PRO */}
          <ActionCard
            title="Estadísticas Pro"
            subtitle="Data Intelligence"
            description="Análisis avanzado sobre el volumen de pases y eficiencia ofensiva de tus jugadores basada en datos reales del campo."
            ctaText="Ver estadísticas"
            colorClass="bg-brandDark shadow-dark/30"
            onClick={() => navigate('/trends')}
            icon={<span className="text-2xl">📈</span>}
            bgIcon={<svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-center text-center">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Promedio de pases por cadena</p>
              <h4 className="text-4xl font-black text-white mb-1 leading-none">{statsData.avgChains}</h4>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[2px]">pases por cadena</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-center items-center">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3 italic">Tendencia Últimos 3</p>
              <div className="w-full h-16">
                {statsData.sparklineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData.sparklineData}>
                      <Line type="monotone" dataKey="val" stroke="#6d5dfc" strokeWidth={3} dot={false} isAnimationActive={true} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-white/10 rounded-xl">
                    <span className="text-[8px] text-white/20 font-black uppercase">Sin datos</span>
                  </div>
                )}
              </div>
            </div>
          </ActionCard>

          {/* TARJETA 4: CONFIGURACIÓN */}
          <ActionCard
            title="Configuración"
            subtitle="sistema operativo"
            description="Modifica los parámetros reglamentarios del deporte y administra tus listas de contactos para envíos automáticos."
            ctaText="configurar deporte"
            colorClass="bg-slate-600 shadow-slate-300/30"
            onClick={() => { }}
            icon={<span className="text-2xl">⚙️</span>}
            bgIcon={<svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3">Configuración Deporte</p>
                <div className="text-[10px] text-white font-bold leading-relaxed opacity-90 uppercase bg-white/5 p-2 rounded-xl">
                  4 cuartos, 15 minutos, sin desempate
                </div>
              </div>
              <button className="text-[9px] font-black text-white uppercase tracking-tighter hover:underline mt-4 text-left opacity-80">editar deporte</button>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3">Configuración Contactos</p>
                <div className="flex items-center gap-2">
                  <h4 className="text-3xl font-black text-white leading-none">4</h4>
                  <span className="text-[9px] font-bold text-white/50 uppercase leading-tight">Listas de distribución</span>
                </div>
              </div>
              <button className="text-[9px] font-black text-white uppercase tracking-tighter hover:underline mt-4 text-left opacity-80">gestionar listas de distribución</button>
            </div>
          </ActionCard>
        </section>
      </main>

      <footer className="px-8 py-8 flex flex-col items-center shrink-0 bg-white border-t border-surfaceVariant mt-6">
        <button
          onClick={onLogout}
          className="group flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-[3px] bg-red-50 px-10 py-4 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md active:scale-95 border border-red-100"
        >
          <span>🚪</span> FINALIZAR SESIÓN SEGURA
        </button>
        <p className="mt-8 text-[8px] text-onSurfaceVariant/40 font-black tracking-[4px] uppercase italic">SportNotes Professional Dashboard • 2024</p>
      </footer>

      {showRecycleModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-brandDark/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 border border-surfaceVariant">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 text-3xl mb-6">♻️</div>
            <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-[4px] mb-2">Reutilizar Partido</h3>
            <p className="text-[11px] text-onSurfaceVariant/70 font-bold mb-8 leading-relaxed">
              ¿Deseas generar un nuevo juego con los equipos <span className="text-dark font-black">{showRecycleModal.teamHome.name}</span> y <span className="text-dark font-black">{showRecycleModal.teamAway.name}</span>?
              <br /><br />
              Se mantendrán los colores y configuraciones, pero el marcador y eventos se reiniciarán.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => {
                  handleRecycle(showRecycleModal);
                  setShowRecycleModal(null);
                }}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl active:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                SÍ, GENERAR NUEVO
              </button>
              <button
                onClick={() => setShowRecycleModal(null)}
                className="w-full bg-surface text-onSurfaceVariant font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* showTacticsModal block removed for MVP */}

    </div>

  );
};

export default DashboardView;
