import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '../components/Button';

interface GlobalStatsDashboardProps {
    matches: Game[];
}

interface StatPoint {
    id: string;
    name: string;
    date: string;
    result: string;
    pérdidas: number;
    recuperos: number;
    disparos: number;
    faltas: number;
}

const GlobalStatsDashboard: React.FC<GlobalStatsDashboardProps> = ({ matches }) => {
    const navigate = useNavigate();
    const [range, setRange] = useState<'5' | '10' | 'ALL'>('5');
    const [activeLines, setActiveLines] = useState({
        pérdidas: true,
        recuperos: true,
        disparos: true,
        faltas: true
    });

    // Comparison State
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonSelection, setComparisonSelection] = useState<string[]>([]);

    const processedData = useMemo(() => {
        const sorted = [...matches].sort((a, b) => a.createdAt - b.createdAt);

        const data: StatPoint[] = sorted.map(match => {
            const stats = { pérdidas: 0, recuperos: 0, disparos: 0, faltas: 0 };
            match.events.forEach(event => {
                if (event.teamId === match.teamHome.id) {
                    if (event.type.includes('PÉRDIDA')) stats.pérdidas++;
                    if (event.type.includes('RECUPERO')) stats.recuperos++;
                    if (event.type.includes('DISPARO') || event.type.includes('GOL')) stats.disparos++;
                    if (event.type.includes('FALTA')) stats.faltas++;
                }
            });
            return {
                id: match.id,
                name: match.teamAway.name,
                date: new Date(match.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
                result: `${match.scoreHome} - ${match.scoreAway}`,
                ...stats
            };
        });
        if (range === '5') return data.slice(-5);
        if (range === '10') return data.slice(-10);
        return data;
    }, [matches, range]);

    const averages = useMemo(() => {
        if (processedData.length === 0) return { pérdidas: '0.0', recuperos: '0.0', disparos: '0.0', faltas: '0.0' };
        const totals = processedData.reduce((acc, curr) => ({
            pérdidas: acc.pérdidas + curr.pérdidas,
            recuperos: acc.recuperos + curr.recuperos,
            disparos: acc.disparos + curr.disparos,
            faltas: acc.faltas + curr.faltas
        }), { pérdidas: 0, recuperos: 0, disparos: 0, faltas: 0 });
        return {
            pérdidas: (totals.pérdidas / processedData.length).toFixed(1),
            recuperos: (totals.recuperos / processedData.length).toFixed(1),
            disparos: (totals.disparos / processedData.length).toFixed(1),
            faltas: (totals.faltas / processedData.length).toFixed(1)
        };
    }, [processedData]);

    const toggleLine = (dataKey: string) => {
        setActiveLines(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof prev] }));
    };

    const handleSelectForComparison = (id: string) => {
        if (comparisonSelection.includes(id)) {
            setComparisonSelection(prev => prev.filter(i => i !== id));
        } else if (comparisonSelection.length < 2) {
            setComparisonSelection(prev => [...prev, id]);
        }
    };

    const comparisonData = useMemo(() => {
        if (comparisonSelection.length !== 2) return null;
        return comparisonSelection.map(id => {
            const m = matches.find(match => match.id === id);
            if (!m) return null;
            const stats = { pérdidas: 0, recuperos: 0, disparos: 0, faltas: 0 };
            m.events.forEach(e => {
                if (e.teamId === m.teamHome.id) {
                    if (e.type.includes('PÉRDIDA')) stats.pérdidas++;
                    if (e.type.includes('RECUPERO')) stats.recuperos++;
                    if (e.type.includes('DISPARO') || e.type.includes('GOL')) stats.disparos++;
                    if (e.type.includes('FALTA')) stats.faltas++;
                }
            });
            return { ...m, ...stats };
        }).filter(x => x !== null);
    }, [comparisonSelection, matches]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const match = payload[0].payload;
            return (
                <div className="bg-white border border-surfaceVariant shadow-2xl rounded-[24px] p-4 animate-in zoom-in duration-200">
                    <p className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-2 border-b border-surfaceVariant pb-2">
                        vs {match.name} • {match.date}
                    </p>
                    <div className="flex items-center gap-4 mb-3">
                        <span className="text-2xl font-black text-dark">{match.result}</span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${parseInt(match.result.split('-')[0]) > parseInt(match.result.split('-')[1]) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {parseInt(match.result.split('-')[0]) > parseInt(match.result.split('-')[1]) ? 'VICTORIA' : 'DERROTA'}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-[10px] font-bold text-onSurfaceVariant uppercase">{entry.name}:</span>
                                </div>
                                <span className="text-xs font-black text-dark">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col overflow-y-auto no-scrollbar pb-16 relative">
            <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-surfaceVariant shrink-0 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-surfaceVariant shadow-sm hover:scale-110 transition-transform">
                        <span className="text-primary font-black">←</span>
                    </button>
                    <img src="./assets/logoLargoSN.svg" alt="Sportsnote Logo" className="h-8 md:h-9 w-auto" />
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full flex flex-col gap-8 px-4 md:px-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="contrail-font text-3xl md:text-4xl text-dark uppercase tracking-tighter leading-none">Intelligence Hub</h2>
                        <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-[4px] opacity-60">Tendencias Globales & Comparativa</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => setIsComparing(true)}
                            className="px-6 py-2.5 rounded-2xl bg-brandDark text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-dark/20 hover:scale-105 transition-all"
                        >
                            ⚖️ Comparar 2 Juegos
                        </button>

                        <div className="bg-white border border-surfaceVariant rounded-[24px] p-1.5 flex gap-1 shadow-sm">
                            {[
                                { id: '5', label: 'Últimos 5' },
                                { id: '10', label: 'Últimos 10' },
                                { id: 'ALL', label: 'Temporada' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setRange(opt.id as any)}
                                    className={`px-4 md:px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${range === opt.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-onSurfaceVariant hover:bg-surface'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Promedios */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { id: 'disparos', label: 'Disparos / PJ', value: averages.disparos, color: '#6d5dfc', icon: '🥅' },
                        { id: 'recuperos', label: 'Recuperos / PJ', value: averages.recuperos, color: '#10b981', icon: '📈' },
                        { id: 'pérdidas', label: 'Pérdidas / PJ', value: averages.pérdidas, color: '#ef4444', icon: '📉' },
                        { id: 'faltas', label: 'Faltas / PJ', value: averages.faltas, color: '#f59e0b', icon: '⚠️' }
                    ].map(stat => (
                        <div key={stat.id} className="bg-white border border-surfaceVariant rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">{stat.icon}</span>
                                <span className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <p className="text-4xl font-black text-dark" style={{ color: activeLines[stat.id as keyof typeof activeLines] ? stat.color : '#e2e8f0' }}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </section>

                {/* Gráfico */}
                <section className="bg-white border-2 border-surfaceVariant rounded-[48px] p-6 lg:p-10 shadow-xl overflow-hidden min-h-[500px] flex flex-col w-full">
                    <div className="flex justify-between items-center mb-8 px-4">
                        <h3 className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-[3px] italic">Evolución de Performance</h3>
                    </div>

                    <div className="flex-1 w-full min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    height={50}
                                    onClick={(e) => toggleLine(e.dataKey as string)}
                                    content={({ payload }) => (
                                        <div className="flex flex-wrap justify-center gap-6 mb-8">
                                            {payload?.map((entry: any, index: number) => (
                                                <button
                                                    key={`item-${index}`}
                                                    onClick={() => toggleLine(entry.dataKey)}
                                                    className={`flex items-center gap-2 transition-all ${activeLines[entry.dataKey as keyof typeof activeLines] ? 'opacity-100' : 'opacity-20 grayscale'}`}
                                                >
                                                    <div className="w-4 h-1 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-[10px] font-black text-dark uppercase tracking-widest">{entry.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                                <Line type="monotone" dataKey="disparos" name="Disparos" stroke="#6d5dfc" strokeWidth={4} dot={{ r: 6, fill: '#6d5dfc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} hide={!activeLines.disparos} animationDuration={1500} />
                                <Line type="monotone" dataKey="recuperos" name="Recuperos" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} hide={!activeLines.recuperos} animationDuration={1500} />
                                <Line type="monotone" dataKey="pérdidas" name="Pérdidas" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} hide={!activeLines.pérdidas} animationDuration={1500} />
                                <Line type="monotone" dataKey="faltas" name="Faltas" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} hide={!activeLines.faltas} animationDuration={1500} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {processedData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[48px] border-2 border-dashed border-surfaceVariant">
                        <span className="text-6xl mb-6">📊</span>
                        <p className="text-onSurfaceVariant font-black uppercase tracking-[4px] text-xs opacity-40">No hay datos suficientes para mostrar tendencias</p>
                    </div>
                )}
            </main>

            {/* Selector de Comparación Modal */}
            {isComparing && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-brandDark/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[90vh] border border-surfaceVariant overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-dark uppercase tracking-tight">Seleccionar 2 Partidos</h3>
                                <p className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-widest">{comparisonSelection.length}/2 Seleccionados</p>
                            </div>
                            <button onClick={() => { setIsComparing(false); setComparisonSelection([]); }} className="text-2xl opacity-40 hover:opacity-100">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 no-scrollbar">
                            {matches.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectForComparison(m.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${comparisonSelection.includes(m.id) ? 'border-primary bg-primary/5' : 'border-surfaceVariant hover:border-primary/30'}`}
                                >
                                    <div className="text-left">
                                        <p className="text-xs font-black text-dark uppercase">vs {m.teamAway.name}</p>
                                        <p className="text-[9px] font-bold text-onSurfaceVariant uppercase">{new Date(m.createdAt).toLocaleDateString()} • {m.scoreHome}-{m.scoreAway}</p>
                                    </div>
                                    {comparisonSelection.includes(m.id) && <span className="text-primary text-xl">✅</span>}
                                </button>
                            ))}
                        </div>

                        {comparisonSelection.length === 2 && comparisonData && (
                            <div className="bg-surface rounded-3xl p-6 border border-surfaceVariant animate-in slide-in-from-bottom duration-500">
                                <h4 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="text-lg">⚖️</span> Resultado Comparativo
                                </h4>
                                <div className="grid grid-cols-3 gap-4 items-center mb-6">
                                    <div className="text-center">
                                        <p className="text-xs font-black text-dark truncate mb-1">{comparisonData[0]?.teamAway.name}</p>
                                        <p className="text-3xl font-black text-primary">{comparisonData[0]?.scoreHome}-{comparisonData[0]?.scoreAway}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(comparisonData[0]!.scoreHome / (comparisonData[0]!.scoreHome + comparisonData[1]!.scoreHome + 0.1)) * 100}%` }}></div>
                                            <div className="h-full bg-slate-300 transition-all duration-1000" style={{ width: '1px' }}></div>
                                            <div className="h-full bg-brandDark transition-all duration-1000" style={{ width: `${(comparisonData[1]!.scoreHome / (comparisonData[0]!.scoreHome + comparisonData[1]!.scoreHome + 0.1)) * 100}%` }}></div>
                                        </div>
                                        <p className="text-[8px] text-center font-black uppercase opacity-40">Benchmark de Goles</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-dark truncate mb-1">{comparisonData[1]?.teamAway.name}</p>
                                        <p className="text-3xl font-black text-brandDark">{comparisonData[1]?.scoreHome}-{comparisonData[1]?.scoreAway}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: 'Disparos', val1: (comparisonData[0] as any).disparos, val2: (comparisonData[1] as any).disparos },
                                        { label: 'Recuperos', val1: (comparisonData[0] as any).recuperos, val2: (comparisonData[1] as any).recuperos },
                                        { label: 'Pérdidas', val1: (comparisonData[0] as any).pérdidas, val2: (comparisonData[1] as any).pérdidas },
                                        { label: 'Faltas', val1: (comparisonData[0] as any).faltas, val2: (comparisonData[1] as any).faltas }
                                    ].map(stat => (
                                        <div key={stat.label} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[8px] font-black uppercase">
                                                <span className={stat.val1 > stat.val2 ? 'text-primary' : 'text-onSurfaceVariant'}>{stat.val1}</span>
                                                <span className="text-onSurfaceVariant italic">{stat.label}</span>
                                                <span className={stat.val2 > stat.val1 ? 'text-primary' : 'text-onSurfaceVariant'}>{stat.val2}</span>
                                            </div>
                                            <div className="h-1 bg-gray-100 rounded-full flex gap-1 overflow-hidden">
                                                <div className={`h-full transition-all duration-700 ${stat.val1 > stat.val2 ? 'bg-primary' : 'bg-onSurfaceVariant/20'}`} style={{ width: `${(stat.val1 / (stat.val1 + stat.val2 + 0.1)) * 100}%` }}></div>
                                                <div className={`h-full transition-all duration-700 ${stat.val2 > stat.val1 ? 'bg-brandDark' : 'bg-onSurfaceVariant/20'}`} style={{ width: `${(stat.val2 / (stat.val1 + stat.val2 + 0.1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest"
                            onClick={() => { setIsComparing(false); setComparisonSelection([]); }}
                        >
                            Cerrar Análisis
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalStatsDashboard;
