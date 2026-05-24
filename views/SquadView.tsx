import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player, Game } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { GlassCard } from '../components/GlassCard';

interface SquadViewProps {
    matches: Game[];
}

const SquadView: React.FC<SquadViewProps> = ({ matches }) => {
    const navigate = useNavigate();
    const [squad, setSquad] = useState<Player[]>(() => PersistenceManager.loadStateLocal().players || []);
    const [newPlayer, setNewPlayer] = useState({ id: '', name: '', number: '', comments: '' });
    const [isEditing, setIsEditing] = useState(false);

    const calculatePlayerStats = (playerNumber: number) => {
        let goals = 0;
        let greenCards = 0;
        let yellowCards = 0;
        let redCards = 0;

        matches.forEach(game => {
            game.events.forEach(event => {
                const details = event.details || "";
                const playerMark = `Jugador #${playerNumber}`;
                if (details.includes(playerMark) || details.includes(`(#${playerNumber})`)) {
                    if (event.type.includes('GOL')) goals++;
                    if (details.includes('VERDE')) greenCards++;
                    if (details.includes('AMARILLA')) yellowCards++;
                    if (details.includes('ROJA')) redCards++;
                }
            });
        });

        return { goals, greenCards, yellowCards, redCards };
    };

    const handleSavePlayer = () => {
        if (!newPlayer.name || !newPlayer.number) return;

        let updatedSquad: Player[];
        if (isEditing) {
            updatedSquad = squad.map(p => p.id === newPlayer.id ? {
                ...p,
                name: newPlayer.name,
                number: parseInt(newPlayer.number),
                comments: newPlayer.comments
            } : p);
        } else {
            const player: Player = {
                id: Math.random().toString(36).substr(2, 9),
                name: newPlayer.name,
                number: parseInt(newPlayer.number),
                comments: newPlayer.comments
            };
            updatedSquad = [...squad, player];
        }

        setSquad(updatedSquad);
        const state = PersistenceManager.loadStateLocal();
        state.players = updatedSquad;
        PersistenceManager.saveStateLocal(state);
        resetForm();
    };

    const handleDeletePlayer = () => {
        if (!newPlayer.id) return;
        if (window.confirm('¿Seguro que deseas eliminar este jugador?')) {
            const updatedSquad = squad.filter(p => p.id !== newPlayer.id);
            setSquad(updatedSquad);
            const state = PersistenceManager.loadStateLocal();
            state.players = updatedSquad;
            PersistenceManager.saveStateLocal(state);
            resetForm();
        }
    };

    const resetForm = () => {
        setNewPlayer({ id: '', name: '', number: '', comments: '' });
        setIsEditing(false);
    };

    const startEdit = (player: Player) => {
        setNewPlayer({
            id: player.id,
            name: player.name,
            number: player.number.toString(),
            comments: player.comments || ''
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen flex flex-col p-6 animate-in fade-in duration-500 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Gestión del Plantel' }]} />
                <div className="hidden sm:flex w-12 h-12 bg-white/5 rounded-2xl items-center justify-center text-white border border-white/10 shadow-lg">
                    <span className="text-2xl"><i className="fa-solid fa-users"></i></span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
                {/* Formulario */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <GlassCard className="p-8 shadow-xl relative overflow-hidden">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest italic border-b border-white/10 pb-2 mb-6 relative z-10">
                            {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
                        </p>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="text-[9px] font-black text-white uppercase tracking-widest block mb-1.5 opacity-60">Nombre y Apellido</label>
                                <input
                                    type="text"
                                    value={newPlayer.name}
                                    onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-[#00fe00] transition-all shadow-inner placeholder-white/30"
                                    placeholder="Ej: Mateo Gómez"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-white uppercase tracking-widest block mb-1.5 opacity-60">Dorsal</label>
                                <input
                                    type="number"
                                    value={newPlayer.number}
                                    onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-[#00fe00] transition-all shadow-inner placeholder-white/30"
                                    placeholder="Ej: 10"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-white uppercase tracking-widest block mb-1.5 opacity-60">Comentarios</label>
                                <textarea
                                    value={newPlayer.comments}
                                    onChange={e => setNewPlayer({ ...newPlayer, comments: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-[#00fe00] transition-all shadow-inner h-28 resize-none placeholder-white/30"
                                    placeholder="Notas adicionales..."
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={handleSavePlayer}
                                    className="w-full bg-[#00fe00] text-black font-black py-5 rounded-2xl active:scale-95 text-[11px] uppercase tracking-widest shadow-[0_0_15px_rgba(0,254,0,0.2)] transition-all hover:bg-[#00fe00]/80"
                                >
                                    {isEditing ? 'ACTUALIZAR DATOS' : 'GUARDAR JUGADOR'}
                                </button>

                                {isEditing && (
                                    <>
                                        <button
                                            onClick={handleDeletePlayer}
                                            className="w-full bg-white/5 text-red-400 border border-red-500/30 font-black py-4 rounded-2xl active:scale-95 text-[10px] uppercase tracking-widest transition-all hover:bg-red-500/10"
                                        >
                                            ELIMINAR JUGADOR
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="text-[9px] font-black text-white/50 uppercase tracking-widest text-center py-2 underline opacity-50 hover:opacity-100"
                                        >
                                            cancelar edición
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Listado */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[11px] font-black text-white/50 uppercase tracking-[2px] italic">Plantilla Registrada ({squad.length})</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {squad.map(p => {
                            const stats = calculatePlayerStats(p.number);
                            return (
                                <GlassCard key={p.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className="w-14 h-14 bg-white/10 rounded-[22px] flex items-center justify-center text-white font-inter font-black text-lg border border-white/20 shadow-inner">
                                            #{p.number}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-white uppercase leading-tight tracking-tight">{p.name}</span>
                                            {p.comments && (
                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate max-w-[200px] mt-1 italic">
                                                    {p.comments}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 bg-black/20 px-6 py-3 rounded-[24px] border border-white/5 w-full sm:w-auto justify-around">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black text-white/50 uppercase mb-1 opacity-50">Goles</span>
                                            <span className="text-sm font-black text-white">{stats.goals}</span>
                                        </div>

                                        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-green-500 rounded-sm mb-1 shadow-sm" title="Verdes"></div>
                                                <span className="text-[10px] font-black text-white leading-none">{stats.greenCards}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-yellow-400 rounded-sm mb-1 shadow-sm" title="Amarillas"></div>
                                                <span className="text-[10px] font-black text-white leading-none">{stats.yellowCards}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-red-600 rounded-sm mb-1 shadow-sm" title="Rojas"></div>
                                                <span className="text-[10px] font-black text-white leading-none">{stats.redCards}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => startEdit(p)}
                                            className="w-10 h-10 bg-white/5 border border-white/10 shadow-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all text-sm ml-2 group-hover:scale-110 active:scale-90"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </GlassCard>
                            );
                        })}

                        {squad.length === 0 && (
                            <GlassCard className="border-2 border-dashed border-white/10 rounded-[40px] p-20 flex flex-col items-center opacity-40">
                                <span className="text-5xl mb-4"><i className="fa-solid fa-clipboard-list"></i></span>
                                <p className="text-[12px] font-black uppercase tracking-[3px] text-white">Plantel vacío</p>
                                <p className="text-[9px] font-bold uppercase opacity-60 mt-2 tracking-widest text-white">Empieza agregando tu primer jugador</p>
                            </GlassCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadView;
