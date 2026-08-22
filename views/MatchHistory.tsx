import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { GlassCard } from '../components/GlassCard';

interface MatchHistoryProps {
    matches: Game[];
    onCreateFromTemplate: (game: Game) => void;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, onCreateFromTemplate }) => {
    const navigate = useNavigate();
    const [showRecycleModal, setShowRecycleModal] = React.useState<Game | null>(null);

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

    const sortedMatches = [...matches].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="min-h-screen w-full flex flex-col overflow-y-auto no-scrollbar pb-16 relative z-10">
            <div className="pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
                <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Historial de Partidos' }]} />
            </div>

            <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
                <section className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                        <h2 className="contrail-font text-3xl text-white uppercase tracking-tighter">Historial de Partidos</h2>
                        <p className="text-white/70 font-bold text-[9px] uppercase tracking-[3px] opacity-60 mt-1">
                            {matches.length} Partidos Registrados
                        </p>
                    </div>
                </section>

                <div className="flex flex-col gap-4">
                    {sortedMatches.map((game) => (
                        <GlassCard
                            key={game.id}
                            className="p-5 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 min-w-0">
                                {/* Bloque Izquierdo: Marcador y Equipos */}
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-[#131041]/60 border border-white/5 p-3 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
                                    {/* Equipo Local */}
                                    <div className="flex flex-col items-center min-w-[70px]">
                                        <div
                                            className="w-10 h-10 rounded-2xl mb-1 flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20"
                                            style={{ backgroundColor: game.teamHome.primaryColor || '#1f2937', color: game.teamHome.secondaryColor || '#ffffff' }}
                                        >
                                            {game.teamHome.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[11px] font-black text-white uppercase truncate max-w-[80px] text-center">
                                            {game.teamHome.name}
                                        </span>
                                    </div>

                                    {/* Resultado */}
                                    <div className="flex flex-col items-center px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-white tabular-nums">{game.scoreHome}</span>
                                            <span className="text-white/40 font-black text-base">-</span>
                                            <span className="text-2xl font-black text-white tabular-nums">{game.scoreAway}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-[#a5b4fc] uppercase tracking-widest mt-0.5">
                                            {new Date(game.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Equipo Visitante */}
                                    <div className="flex flex-col items-center min-w-[70px]">
                                        <div
                                            className="w-10 h-10 rounded-2xl mb-1 flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20"
                                            style={{ backgroundColor: game.teamAway.primaryColor || '#1f2937', color: game.teamAway.secondaryColor || '#ffffff' }}
                                        >
                                            {game.teamAway.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[11px] font-black text-white uppercase truncate max-w-[80px] text-center">
                                            {game.teamAway.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Bloque Central/Derecho: Metadatos Contextuales */}
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0 py-1">
                                    <h4 className="font-contrail text-lg md:text-xl text-white uppercase tracking-wide truncate italic">
                                        {game.metadata?.torneo || 'Torneo / Encuentro'}
                                    </h4>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {game.metadata?.categoria && (
                                            <span className="text-[10px] font-black text-white px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10 uppercase tracking-wider">
                                                {game.metadata.categoria}
                                            </span>
                                        )}
                                        {game.metadata?.rama && (
                                            <span className="text-[10px] font-black text-[#38bdf8] px-2.5 py-0.5 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 uppercase tracking-wider">
                                                {game.metadata.rama}
                                            </span>
                                        )}
                                        {game.metadata?.jornada && (
                                            <span className="text-[10px] font-black text-[#00ff87] px-2.5 py-0.5 rounded-lg bg-[#00ff87]/10 border border-[#00ff87]/20 uppercase tracking-wider">
                                                {game.metadata.jornada}
                                            </span>
                                        )}
                                        {game.metadata?.estadio && (
                                            <span className="text-[10px] font-bold text-[#a5b4fc] flex items-center gap-1">
                                                <i className="fa-solid fa-location-dot text-[9px] text-[#38bdf8]"></i> {game.metadata.estadio}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bloque Extremo Derecho: Acciones */}
                            <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto justify-end">
                                <button
                                    onClick={() => navigate(`/summary/${game.id}`)}
                                    className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg text-white transition-all active:scale-90"
                                    title="Estadísticas"
                                ><i className="fa-solid fa-chart-simple text-[#38bdf8]"></i></button>
                                <button
                                    onClick={() => handleShare(game)}
                                    className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg text-white transition-all active:scale-90"
                                    title="Compartir"
                                ><i className="fa-solid fa-share-nodes"></i></button>
                                <button
                                    onClick={() => setShowRecycleModal(game)}
                                    className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg text-white transition-all active:scale-90"
                                    title="Reutilizar"
                                ><i className="fa-solid fa-rotate-right"></i></button>
                            </div>
                        </GlassCard>
                    ))}

                    {matches.length === 0 && (
                        <GlassCard className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                            <span className="text-5xl mb-4 opacity-20">🏟️</span>
                            <p className="text-white/70 font-black uppercase tracking-widest text-xs opacity-40">No hay partidos registrados aún</p>
                            <button
                                onClick={() => navigate('/new-game')}
                                className="mt-6 text-[#00fe00] font-black uppercase text-[10px] tracking-widest hover:underline"
                            >
                                + Registrar primer partido
                            </button>
                        </GlassCard>
                    )}
                </div>
            </main>

            {/* Recycle Confirmation Modal (Copied from Dashboard for consistency) */}
            {showRecycleModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <GlassCard className="w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 text-3xl mb-6">♻️</div>
                        <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[4px] mb-2">Reutilizar Partido</h3>
                        <p className="text-[11px] text-white/50 font-bold mb-8 leading-relaxed">
                            ¿Deseas generar un nuevo juego con los equipos <span className="text-white font-black">{showRecycleModal.teamHome.name}</span> y <span className="text-white font-black">{showRecycleModal.teamAway.name}</span>?
                            <br /><br />
                            Se mantendrán los colores y configuraciones, pero el marcador y eventos se reiniciarán.
                        </p>
                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => {
                                    navigate('/new-game', { state: { template: showRecycleModal } });
                                    setShowRecycleModal(null);
                                }}
                                className="w-full bg-[#00fe00] text-black font-black py-4 rounded-2xl active:scale-95 text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,254,0,0.2)]"
                            >
                                SÍ, GENERAR NUEVO
                            </button>
                            <button
                                onClick={() => setShowRecycleModal(null)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-colors"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default MatchHistory;
