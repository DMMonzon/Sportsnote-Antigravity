import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, UserRole, GameEvent, TacticalScheme } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';
import { Button } from '../components/Button';
import { GameField } from '../components/GameField';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EntryAnalysisCard: React.FC<{
  title: string;
  homeTotal: number;
  awayTotal: number;
  icon?: string;
  children: React.ReactNode;
}> = ({ title, homeTotal, awayTotal, icon, children }) => (
  <div className="bg-surface/50 p-5 rounded-[28px] border border-surfaceVariant shadow-sm flex flex-col gap-4">
    <div className="flex justify-between items-center border-b border-surfaceVariant pb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xs">{icon}</span>}
        <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{title}</h4>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-black text-dark">{homeTotal}</span>
        <span className="text-[10px] font-bold text-onSurfaceVariant/40">/</span>
        <span className="text-xl font-black text-dark">{awayTotal}</span>
      </div>
    </div>
    <div className="flex-1 flex flex-col gap-6 py-2">
      {children}
    </div>
  </div>
);

const SectorRectangle: React.FC<{
  label: string;
  teamColor: string;
  stats: Record<string, number>;
  sectors: string[];
  borderPosition?: 'top' | 'bottom';
  type?: 'area' | 'zone23';
}> = ({ label, teamColor, stats, sectors, borderPosition, type }) => {
  const values = sectors.map(s => stats[s] || 0);
  const maxVal = values.length > 0 ? Math.max(...values) : -1;
  const isMax = (val: number) => val > 0 && val === maxVal;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-tighter opacity-70">{label}</p>
      <div className={`w-full overflow-hidden flex flex-col ${borderPosition === 'top' ? 'flex-col-reverse' : 'flex-col'}`}>
        <div 
          className={`w-full h-12 bg-surfaceVariant/5 border border-surfaceVariant flex overflow-hidden ${
            type === 'zone23'
              ? 'rounded-none'
              : borderPosition === 'top' ? 'rounded-b-[40px] rounded-t-md' : 'rounded-t-[40px] rounded-b-md'
          }`}
          style={type === 'zone23' ? {
            borderTopStyle: borderPosition === 'bottom' ? 'dashed' : undefined,
            borderTopWidth: borderPosition === 'bottom' ? '2px' : undefined,
            borderBottomStyle: borderPosition === 'top' ? 'dashed' : undefined,
            borderBottomWidth: borderPosition === 'top' ? '2px' : undefined,
          } : undefined}
        >
          {sectors.map((sect, index) => {
            const val = stats[sect] || 0;
            const active = isMax(val);
            
            // Determinar clases de curvas para las celdas de los extremos
            let cellRoundedClass = '';
            if (type !== 'zone23') {
              if (borderPosition === 'top') {
                if (index === 0) cellRoundedClass = 'rounded-bl-[40px]';
                if (index === sectors.length - 1) cellRoundedClass = 'rounded-br-[40px]';
              } else {
                if (index === 0) cellRoundedClass = 'rounded-tl-[40px]';
                if (index === sectors.length - 1) cellRoundedClass = 'rounded-tr-[40px]';
              }
            }

            return (
              <div
                key={sect}
                className={`flex-1 border-r last:border-r-0 border-surfaceVariant/20 flex flex-col items-center justify-center transition-all ${cellRoundedClass} ${active ? 'bg-primary/10' : ''}`}
              >
                <span className={`text-[10px] font-black ${active ? 'text-primary' : 'text-dark/40'}`}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SummaryViewProps {
  allTactics?: TacticalScheme[];
}

const SummaryView: React.FC<SummaryViewProps> = ({ allTactics = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [actionFilter, setActionFilter] = useState<'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');

  useEffect(() => {
    if (id) {
      const data = PersistenceManager.getGame(id);
      if (data) setGame(data);
    }
  }, [id]);

  const filteredEvents = useMemo(() => {
    if (!game) return [];
    return game.events.filter(e => {
      const typeMatch = actionFilter === 'ALL' || e.type.includes(actionFilter);
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return typeMatch && periodMatch;
    });
  }, [game, actionFilter, periodFilter]);

  const passTrendData = useMemo(() => {
    if (!game) return [];
    const periods = ['1Q', '2Q', '3Q', '4Q'];
    return periods.map(p => {
      const periodPasses = game.events
        .filter(e => e.gameTime.startsWith(p) && e.details?.includes('pases'))
        .map(e => {
          const match = e.details?.match(/\((\d+) pases\)/);
          return match ? parseInt(match[1]) : 0;
        });
      const total = periodPasses.reduce((a, b) => a + b, 0);
      return { name: p, pases: total };
    });
  }, [game]);

  const usedTacticIds = useMemo(() => {
    if (!game) return [];
    const ids = new Set<string>();
    game.events.forEach(e => {
      if (e.tacticId) ids.add(e.tacticId);
    });
    return Array.from(ids);
  }, [game]);

  const getTacticStats = (tacticId: string) => {
    if (!game) return null;
    const tacticEvents = game.events.filter(e => e.tacticId === tacticId);
    if (tacticEvents.length === 0) return null;

    const stats = {
      name: allTactics.find(t => t.id === tacticId)?.name || 'Táctica Desconocida',
      home: { recuperos: 0, perdidas: 0, remates: 0, faltas: 0 },
      away: { recuperos: 0, perdidas: 0, remates: 0, faltas: 0 }
    };

    tacticEvents.forEach(e => {
      const isHome = e.teamId === game.teamHome.id;
      const type = e.type.toUpperCase();
      
      const target = isHome ? stats.home : stats.away;

      if (type.includes('RECUPERO')) target.recuperos++;
      else if (type.includes('PÉRDIDA')) target.perdidas++;
      else if (type.includes('DISPARO') || type.includes('GOL')) target.remates++;
      else if (type.includes('FALTA')) target.faltas++;
    });

    return stats;
  };

  const { statsArea, stats23 } = React.useMemo(() => {
    const statsArea = {
      home: { 'Extremo Derecho': 0, 'Centro Derecha': 0, 'Centro': 0, 'Centro Izquierda': 0, 'Extremo Izquierdo': 0 },
      away: { 'Extremo Derecho': 0, 'Centro Derecha': 0, 'Centro': 0, 'Centro Izquierda': 0, 'Extremo Izquierdo': 0 }
    };
    const stats23 = {
      home: { 'Derecha': 0, 'Centro': 0, 'Izquierda': 0 },
      away: { 'Derecha': 0, 'Centro': 0, 'Izquierda': 0 }
    };

    if (!game?.events) return { statsArea, stats23 };

    const periodEvents = game.events.filter(e => {
      if (periodFilter === 'ALL') return true;
      return e.gameTime.startsWith(`${periodFilter}Q`);
    });

    periodEvents.forEach(e => {
      const type = (e.type || "").toLowerCase();
      const details = (e.details || "").toLowerCase();

      if (type.includes('ingreso')) {
        const isHomeEntry = !type.includes('rival');

        if (type.includes('área')) {
          ['Extremo Derecho', 'Centro Derecha', 'Centro', 'Centro Izquierda', 'Extremo Izquierdo'].forEach(sect => {
            if (details.includes(sect.toLowerCase())) {
              if (isHomeEntry) statsArea.home[sect as keyof typeof statsArea.home]++;
              else statsArea.away[sect as keyof typeof statsArea.away]++;
            }
          });
        } else if (type.includes('23')) {
          ['Derecha', 'Centro', 'Izquierda'].forEach(lane => {
            if (details.includes(lane.toLowerCase())) {
              if (isHomeEntry) stats23.home[lane as keyof typeof stats23.home]++;
              else stats23.away[lane as keyof typeof stats23.away]++;
            }
          });
        }
      }
    });

    return { statsArea, stats23 };
  }, [game?.events, periodFilter]);

  if (!game) return (
    <div className="flex-1 flex items-center justify-center bg-surface">
      <p className="text-onSurfaceVariant font-black uppercase tracking-widest animate-pulse">Cargando Reporte...</p>
    </div>
  );

  const getGoals = (teamId: string) => game.events.filter(e => e.teamId === teamId && e.type.includes('GOL'));
  const getGoalMode = (event: GameEvent) => {
    if (event.details?.toLowerCase().includes('penal')) return 'Penal';
    if (event.details?.toLowerCase().includes('corto')) return 'Córner Corto';
    if (event.details?.toLowerCase().includes('pases')) return 'Jugada Colectiva';
    return 'Jugada Individual';
  };

  const getDetailedStat = (types: string[], teamId: string) => {
    const events = game.events.filter(e => {
      const isTeam = e.teamId === teamId;
      const isTarget = types.some(t => {
        const typeUpper = e.type.toUpperCase();
        const tUpper = t.toUpperCase();
        return typeUpper === tUpper || typeUpper.includes(`${tUpper} `) || typeUpper.includes(`(${tUpper})`);
      });
      return isTeam && isTarget;
    });
    const getPeriodCount = (p: string) => events.filter(e => e.gameTime.startsWith(p)).length;
    return {
      total: events.length,
      own: events.filter(e => e.half === 'own').length,
      rival: events.filter(e => e.half === 'rival').length,
      left: events.filter(e => e.lane === 'left').length,
      center: events.filter(e => e.lane === 'center').length,
      right: events.filter(e => e.lane === 'right').length,
      goals: events.filter(e => e.type.includes('GOL')).length,
      saved: events.filter(e => e.type.includes('ATAJADO')).length,
      missed: events.filter(e => e.type.includes('DESVIADO')).length,
      periods: { q1: getPeriodCount('1Q'), q2: getPeriodCount('2Q'), q3: getPeriodCount('3Q'), q4: getPeriodCount('4Q') }
    };
  };

  const PeriodRow = ({ periods }: { periods: { q1: number, q2: number, q3: number, q4: number } }) => (
    <div className="flex justify-between items-center mt-3 pt-2 border-t border-surfaceVariant/30 text-[7px] font-black text-onSurfaceVariant/50 uppercase tracking-widest">
      {['1', '2', '3', '4'].map(q => (
        <div key={q} className="flex flex-col items-center">
          <span>Q{q}</span>
          <span className="text-[9px] text-dark">{(periods as any)[`q${q}`]}</span>
        </div>
      ))}
    </div>
  );

  const handleDownloadPDF = async () => {
    if (!reportRef.current || isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f4f4f7' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const finalWidth = canvas.width * ratio;
      const finalHeight = canvas.height * ratio;
      pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, 10, finalWidth, finalHeight);
      pdf.save(`Reporte_${game.teamHome.name}_vs_${game.teamAway.name}_${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '_'));
    } catch (error) { console.error("Error generating PDF:", error); }
    finally { setIsGeneratingPDF(false); }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Timestamp', 'GameTime', 'Type', 'Team', 'X', 'Y', 'Half', 'Lane', 'Details'].join(',');
    const rows = game.events.map(e => [e.id, new Date(e.timestamp).toISOString(), e.gameTime, e.type, e.teamId === game.teamHome.id ? 'LOCAL' : 'VISITA', e.x, e.y, e.half || '', e.lane || '', e.details || ''].join(',')).join('\n');
    const blob = new Blob([[headers, rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${game.teamHome.name}_vs_${game.teamAway.name}.csv`;
    link.click();
  };

  const handleCopySummary = async () => {
    try {
      const summaryText = `Resumen: ${game.teamHome.name} ${game.scoreHome} - ${game.scoreAway} ${game.teamAway.name}\n` +
        `Remates: ${getDetailedStat(['DISPARO'], game.teamHome.id).total} - ${getDetailedStat(['DISPARO'], game.teamAway.id).total}\n` +
        `ID de Partido: ${game.id}\n\n` +
        `Data completa exportada desde SportNotes APP.`;
      
      await navigator.clipboard.writeText(summaryText);
      alert('Resumen copiado al portapapeles con éxito.');
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar el resumen. Verifica los permisos de tu navegador.');
    }
  };

  const homeShots = getDetailedStat(['DISPARO'], game.teamHome.id);
  const awayShots = getDetailedStat(['DISPARO'], game.teamAway.id);

  const getPct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface overflow-y-auto no-scrollbar pb-16 relative">
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-surfaceVariant shrink-0 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-surfaceVariant shadow-sm hover:scale-110 transition-transform">
            <span className="text-primary font-black">←</span>
          </button>
          <img src="./assets/logoLargoSN.svg" alt="SportNotes Logo" className="h-8 md:h-9 w-auto" />
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full flex flex-col gap-8 px-4 md:px-8">
        <div ref={reportRef} className="flex flex-col gap-8">
          <header className="text-center pt-4">
            <h2 className="contrail-font text-dark text-4xl mb-1 uppercase tracking-tighter">Reporte Final</h2>
            <p className="text-[10px] text-onSurfaceVariant font-black uppercase tracking-[4px] opacity-60">Data Report SportNotes • ID: {game.id}</p>
          </header>

          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-surfaceVariant relative overflow-hidden">
            <div className="flex justify-between items-start gap-6 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <div className="text-[10px] text-onSurfaceVariant uppercase font-black mb-1 truncate">{game.teamHome.name}</div>
                <div className="text-6xl contrail-font text-primary drop-shadow-sm mb-4">{game.scoreHome}</div>
                <div className="space-y-1.5 border-t border-surfaceVariant pt-3">
                  {getGoals(game.teamHome.id).map(g => (
                    <div key={g.id} className="text-[9px] font-bold text-onSurfaceVariant flex items-center gap-2 justify-center md:justify-start">
                      <span className="text-primary">⚽</span>
                      <span>{g.gameTime} • {getGoalMode(g)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center h-full pt-8">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-black text-onSurfaceVariant text-xs border border-surfaceVariant">VS</div>
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="text-[10px] text-onSurfaceVariant uppercase font-black mb-1 truncate">{game.teamAway.name}</div>
                <div className="text-6xl contrail-font text-dark drop-shadow-sm mb-4">{game.scoreAway}</div>
                <div className="space-y-1.5 border-t border-surfaceVariant pt-3 flex flex-col items-center md:items-end">
                  {getGoals(game.teamAway.id).map(g => (
                    <div key={g.id} className="text-[9px] font-bold text-onSurfaceVariant flex items-center gap-2 justify-center md:justify-end">
                      <span>{g.gameTime} • {getGoalMode(g)}</span>
                      <span className="text-dark">⚽</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
            <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 flex items-center gap-2 italic">
              <span className="text-sm">🥅</span> Remates al Arco <div className="h-px flex-1 bg-surfaceVariant/50"></div>
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-surface rounded-[24px] p-5 border border-surfaceVariant/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-onSurfaceVariant uppercase">Local</span>
                  <span className="text-3xl font-black">{homeShots.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Gol</p>
                    <p className="text-sm font-black">{homeShots.goals} ({getPct(homeShots.goals, homeShots.total)}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Atajado</p>
                    <p className="text-sm font-black">{homeShots.saved} ({getPct(homeShots.saved, homeShots.total)}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Desv.</p>
                    <p className="text-sm font-black">{homeShots.missed} ({getPct(homeShots.missed, homeShots.total)}%)</p>
                  </div>
                </div>
                <PeriodRow periods={homeShots.periods} />
              </div>
              <div className="flex-1 bg-surface rounded-[24px] p-5 border border-surfaceVariant/50">
                <div className="flex justify-between items-center mb-4 text-right">
                  <span className="text-3xl font-black">{awayShots.total}</span>
                  <span className="text-[9px] font-black text-onSurfaceVariant uppercase">Visitante</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Gol</p>
                    <p className="text-sm font-black">{awayShots.goals} ({getPct(awayShots.goals, awayShots.total)}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Atajado</p>
                    <p className="text-sm font-black">{awayShots.saved} ({getPct(awayShots.saved, awayShots.total)}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] uppercase opacity-60">Desv.</p>
                    <p className="text-sm font-black">{awayShots.missed} ({getPct(awayShots.missed, awayShots.total)}%)</p>
                  </div>
                </div>
                <PeriodRow periods={awayShots.periods} />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
            <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 italic">Balance de Acciones (Local)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Pérdidas', icon: '📉', types: ['PÉRDIDA'], color: 'text-orange-600' },
                { label: 'Recuperos', icon: '📈', types: ['RECUPERO'], color: 'text-emerald-600' },
                { label: 'Faltas', icon: '⚠️', types: ['FALTA'], color: 'text-red-600' }
              ].map(stat => {
                const data = getDetailedStat(stat.types, game.teamHome.id);
                return (
                  <div key={stat.label} className="bg-surface/30 p-5 rounded-[28px] border border-surfaceVariant flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center border-b border-surfaceVariant pb-2">
                      <div className="flex items-center gap-2">
                        {stat.icon && <span className="text-[10px]">{stat.icon}</span>}
                        <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <span className={`text-2xl font-black ${stat.color}`}>{data.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-surfaceVariant/30"><span className="text-blue-500 text-[10px]">↓</span><div className="flex flex-col"><span className="text-[8px] font-bold opacity-60">Propio</span><span className="text-[11px] font-black">{data.own}</span></div></div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-surfaceVariant/30"><span className="text-orange-500 text-[10px]">↑</span><div className="flex flex-col"><span className="text-[8px] font-bold opacity-60">Rival</span><span className="text-[11px] font-black">{data.rival}</span></div></div>
                    </div>
                    <PeriodRow periods={data.periods} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tactical Performance section removed for MVP */}


          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
            <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 flex items-center gap-2 italic">Ingresos y Accesos Ofensivos <div className="h-px flex-1 bg-surfaceVariant/50"></div></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EntryAnalysisCard
                title="Ingresos al Área"
                icon="📥"
                homeTotal={Object.values(statsArea.home).reduce((a: number, b: number) => a + b, 0)}
                awayTotal={Object.values(statsArea.away).reduce((a: number, b: number) => a + b, 0)}
              >
                <SectorRectangle
                  label="Ingresos al área rival"
                  teamColor={game.teamAway.primaryColor || '#ef4444'}
                  stats={statsArea.home}
                  sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                  borderPosition="top"
                />
                <SectorRectangle
                  label="Ingresos del rival a mi área"
                  teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                  stats={statsArea.away}
                  sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                  borderPosition="bottom"
                />
              </EntryAnalysisCard>

              <EntryAnalysisCard
                title="Ingresos a 23 Yardas"
                icon="2️⃣3️⃣"
                homeTotal={Object.values(stats23.home).reduce((a: number, b: number) => a + b, 0)}
                awayTotal={Object.values(stats23.away).reduce((a: number, b: number) => a + b, 0)}
              >
                <SectorRectangle
                  label="Ingresos a 23 yardas rival"
                  teamColor={game.teamAway.primaryColor || '#ef4444'}
                  stats={stats23.home}
                  sectors={['Izquierda', 'Centro', 'Derecha']}
                  borderPosition="top"
                  type="zone23"
                />
                <SectorRectangle
                  label="Ingresos del rival a mis 23 yardas"
                  teamColor={game.teamHome.primaryColor || '#6d5dfc'}
                  stats={stats23.away}
                  sectors={['Izquierda', 'Centro', 'Derecha']}
                  borderPosition="bottom"
                  type="zone23"
                />
              </EntryAnalysisCard>
            </div>
          </section>



          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
            <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 flex items-center gap-2 italic">
              <span className="text-sm">⏱️</span> Fluctuación de Pases por Período <div className="h-px flex-1 bg-surfaceVariant/50"></div>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={passTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="pases" stroke="#6d5dfc" strokeWidth={4} dot={{ r: 6, fill: '#6d5dfc', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-white border-surfaceVariant h-14" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>{isGeneratingPDF ? '⏳ GENERANDO...' : '💾 PDF REPORT'}</Button>
            <Button variant="outline" className="flex-1 bg-white border-primary/20 text-primary h-14" onClick={handleCopySummary}>📋 COPIAR RESUMEN</Button>
            <Button variant="outline" className="flex-1 bg-white border-surfaceVariant h-14" onClick={downloadCSV}>📊 DATA CSV</Button>
          </div>
          <Button className="w-full h-14 rounded-[24px] shadow-lg shadow-primary/20 font-black uppercase tracking-widest" onClick={() => navigate('/dashboard')}>🏠 REGRESAR AL DASHBOARD</Button>
        </div>
      </main>
    </div>
  );
};

export default SummaryView;
