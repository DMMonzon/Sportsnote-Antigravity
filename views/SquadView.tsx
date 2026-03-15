import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player, Game } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';

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
        <div className="min-h-screen bg-surface flex flex-col p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center text-dark hover:scale-110 active:scale-95 transition-all"
                    >
                        ←
                    </button>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-[4px] leading-none mb-1">Equipo</p>
                        <h1 className="text-2xl font-black text-dark uppercase tracking-tighter">Gestión del Plantel</h1>
                    </div>
                </div>
                <div className="w-12 h-12 bg-emerald-700/10 rounded-2xl flex items-center justify-center text-emerald-700">
                    <span className="text-2xl">👥</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-surfaceVariant/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic border-b border-emerald-100 pb-2 mb-6">
                            {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
                        </p>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1.5 opacity-60">Nombre y Apellido</label>
                                <input
                                    type="text"
                                    value={newPlayer.name}
                                    onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                    className="w-full bg-surface/50 border border-surfaceVariant rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                                    placeholder="Ej: Mateo Gómez"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1.5 opacity-60">Dorsal</label>
                                <input
                                    type="number"
                                    value={newPlayer.number}
                                    onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })}
                                    className="w-full bg-surface/50 border border-surfaceVariant rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                                    placeholder="Ej: 10"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-dark uppercase tracking-widest block mb-1.5 opacity-60">Comentarios</label>
                                <textarea
                                    value={newPlayer.comments}
                                    onChange={e => setNewPlayer({ ...newPlayer, comments: e.target.value })}
                                    className="w-full bg-surface/50 border border-surfaceVariant rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner h-28 resize-none"
                                    placeholder="Notas adicionales..."
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={handleSavePlayer}
                                    className="w-full bg-emerald-700 text-white font-black py-5 rounded-2xl active:scale-95 text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-800"
                                >
                                    {isEditing ? 'ACTUALIZAR DATOS' : 'GUARDAR JUGADOR'}
                                </button>

                                {isEditing && (
                                    <>
                                        <button
                                            onClick={handleDeletePlayer}
                                            className="w-full bg-white text-red-600 border border-red-100 font-black py-4 rounded-2xl active:scale-95 text-[10px] uppercase tracking-widest transition-all hover:bg-red-50"
                                        >
                                            ELIMINAR JUGADOR
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest text-center py-2 underline opacity-50 hover:opacity-100"
                                        >
                                            cancelar edición
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listado */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-[2px] italic">Plantilla Registrada ({squad.length})</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {squad.map(p => {
                            const stats = calculatePlayerStats(p.number);
                            return (
                                <div key={p.id} className="bg-white border border-surfaceVariant p-5 rounded-[32px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-xl hover:border-emerald-200 transition-all animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-[22px] flex items-center justify-center text-emerald-700 font-inter font-black text-lg border border-emerald-100/50 shadow-inner">
                                            #{p.number}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-dark uppercase leading-tight tracking-tight">{p.name}</span>
                                            {p.comments && (
                                                <span className="text-[9px] font-bold text-onSurfaceVariant/40 uppercase tracking-tighter truncate max-w-[200px] mt-1 italic">
                                                    {p.comments}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 bg-surface/50 px-6 py-3 rounded-[24px] border border-surfaceVariant/30 w-full sm:w-auto justify-around">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black text-onSurfaceVariant uppercase mb-1 opacity-50">Goles</span>
                                            <span className="text-sm font-black text-dark">{stats.goals}</span>
                                        </div>

                                        <div className="flex items-center gap-4 border-l border-surfaceVariant/30 pl-6">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-green-500 rounded-sm mb-1 shadow-sm" title="Verdes"></div>
                                                <span className="text-[10px] font-black text-dark leading-none">{stats.greenCards}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-yellow-400 rounded-sm mb-1 shadow-sm" title="Amarillas"></div>
                                                <span className="text-[10px] font-black text-dark leading-none">{stats.yellowCards}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2.5 bg-red-600 rounded-sm mb-1 shadow-sm" title="Rojas"></div>
                                                <span className="text-[10px] font-black text-dark leading-none">{stats.redCards}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => startEdit(p)}
                                            className="w-10 h-10 bg-white border border-surfaceVariant shadow-sm rounded-xl flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-all text-sm ml-2 group-hover:scale-110 active:scale-90"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {squad.length === 0 && (
                            <div className="bg-white/50 border-2 border-dashed border-surfaceVariant rounded-[40px] p-20 flex flex-col items-center opacity-40">
                                <span className="text-5xl mb-4">📋</span>
                                <p className="text-[12px] font-black uppercase tracking-[3px]">Plantel vacío</p>
                                <p className="text-[9px] font-bold uppercase opacity-60 mt-2 tracking-widest">Empieza agregando tu primer jugador</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadView;
