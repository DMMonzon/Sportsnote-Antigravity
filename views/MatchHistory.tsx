import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types';

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
        <div className="min-h-screen w-full flex flex-col bg-surface overflow-y-auto no-scrollbar pb-16 relative">
            <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-surfaceVariant shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-surfaceVariant shadow-sm hover:scale-110 transition-transform"
                    >
                        <span className="text-primary font-black">←</span>
                    </button>
                    <img
                        src="./assets/logoLargoSN.svg"
                        alt="SportNotes Logo"
                        className="h-8 md:h-9 w-auto"
                    />
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
                <section className="flex justify-between items-end border-b border-surfaceVariant pb-4">
                    <div>
                        <h2 className="contrail-font text-3xl text-dark uppercase tracking-tighter">Historial de Partidos</h2>
                        <p className="text-onSurfaceVariant font-bold text-[9px] uppercase tracking-[3px] opacity-60 mt-1">
                            {matches.length} Partidos Registrados
                        </p>
                    </div>
                </section>

                <div className="flex flex-col gap-4">
                    {sortedMatches.map((game) => (
                        <div
                            key={game.id}
                            className="bg-white border border-surfaceVariant rounded-[32px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center gap-4 md:gap-8 flex-1 w-full md:w-auto">
                                {/* Equipo Local */}
                                <div className="flex flex-col items-center md:items-end flex-1 min-w-0">
                                    <div
                                        className="w-10 h-10 rounded-2xl mb-1 flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20"
                                        style={{ backgroundColor: game.teamHome.primaryColor, color: game.teamHome.secondaryColor }}
                                    >
                                        {game.teamHome.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-black text-dark uppercase truncate w-full text-center md:text-right">
                                        {game.teamHome.name}
                                    </span>
                                </div>

                                {/* Resultado */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-dark tabular-nums">{game.scoreHome}</span>
                                        <span className="text-onSurfaceVariant font-black opacity-30 text-xl">-</span>
                                        <span className="text-3xl font-black text-dark tabular-nums">{game.scoreAway}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-onSurfaceVariant uppercase tracking-widest mt-1 opacity-60">
                                        {new Date(game.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Equipo Visitante */}
                                <div className="flex flex-col items-center md:items-start flex-1 min-w-0">
                                    <div
                                        className="w-10 h-10 rounded-2xl mb-1 flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20"
                                        style={{ backgroundColor: game.teamAway.primaryColor, color: game.teamAway.secondaryColor }}
                                    >
                                        {game.teamAway.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-black text-dark uppercase truncate w-full text-center md:text-left">
                                        {game.teamAway.name}
                                    </span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-surfaceVariant pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-center">
                                <button
                                    onClick={() => navigate(`/summary/${game.id}`)}
                                    className="w-12 h-12 rounded-2xl bg-surface hover:bg-primary/5 border border-surfaceVariant flex items-center justify-center text-xl transition-all active:scale-90"
                                    title="Stats"
                                >📊</button>
                                <button
                                    onClick={() => handleShare(game)}
                                    className="w-12 h-12 rounded-2xl bg-surface hover:bg-primary/5 border border-surfaceVariant flex items-center justify-center text-xl transition-all active:scale-90"
                                    title="Share"
                                >📤</button>
                                <button
                                    onClick={() => setShowRecycleModal(game)}
                                    className="w-12 h-12 rounded-2xl bg-surface hover:bg-primary/5 border border-surfaceVariant flex items-center justify-center text-xl transition-all active:scale-90"
                                    title="Recycle"
                                >♻️</button>
                            </div>
                        </div>
                    ))}

                    {matches.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-surfaceVariant/10 rounded-[40px] border-2 border-dashed border-surfaceVariant">
                            <span className="text-5xl mb-4 opacity-20">🏟️</span>
                            <p className="text-onSurfaceVariant font-black uppercase tracking-widest text-xs opacity-40">No hay partidos registrados aún</p>
                            <button
                                onClick={() => navigate('/new-game')}
                                className="mt-6 text-primary font-black uppercase text-[10px] tracking-widest hover:underline"
                            >
                                + Registrar primer partido
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Recycle Confirmation Modal (Copied from Dashboard for consistency) */}
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
                                    navigate('/new-game', { state: { template: showRecycleModal } });
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
        </div>
    );
};

export default MatchHistory;
