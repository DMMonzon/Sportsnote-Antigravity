
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, UserRole, GameEvent, Possession } from '../types';
import { dbService } from '../services/dbService';
import { Button } from '../components/Button';
import { GameField } from '../components/GameField';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SummaryView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filtros para el Mapa de Calor
  const [actionFilter, setActionFilter] = useState<'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');

  useEffect(() => {
    if (id) {
      const data = dbService.getGame(id);
      if (data) setGame(data);
    }
  }, [id]);

  // --- Lógica de Mapa de Calor Filtrado ---
  const filteredEvents = useMemo(() => {
    if (!game) return [];
    return game.events.filter(e => {
      const typeMatch = actionFilter === 'ALL' || e.type.includes(actionFilter);
      const periodMatch = periodFilter === 'ALL' || e.gameTime.startsWith(`${periodFilter}Q`);
      return typeMatch && periodMatch;
    });
  }, [game, actionFilter, periodFilter]);

  // --- Lógica de Tendencia de Pases ---
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

      const avg = periodPasses.length > 0
        ? (periodPasses.reduce((a, b) => a + b, 0) / periodPasses.length)
        : 0;

      return { name: p, pases: parseFloat(avg.toFixed(1)) };
    });
  }, [game]);

  if (!game) return (
    <div className="flex-1 flex items-center justify-center bg-surface">
      <p className="text-onSurfaceVariant font-black uppercase tracking-widest animate-pulse">Cargando Reporte...</p>
    </div>
  );

  // --- Lógica de Goles ---
  const getGoals = (teamId: string) => {
    return game.events.filter(e => e.teamId === teamId && e.type.includes('GOL'));
  };

  const getGoalMode = (event: GameEvent) => {
    if (event.details?.toLowerCase().includes('penal')) return 'Penal';
    if (event.details?.toLowerCase().includes('corto')) return 'Córner Corto';
    if (event.details?.toLowerCase().includes('pases')) return 'Jugada Colectiva';
    return 'Jugada Individual';
  };

  // --- Lógica de Estadísticas Detalladas ---
  const getDetailedStat = (types: string[], teamId: string) => {
    const events = game.events.filter(e =>
      e.teamId === teamId && types.some(t => e.type.toUpperCase().includes(t.toUpperCase()))
    );

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
      periods: {
        q1: getPeriodCount('1Q'),
        q2: getPeriodCount('2Q'),
        q3: getPeriodCount('3Q'),
        q4: getPeriodCount('4Q')
      }
    };
  };

  const PeriodRow = ({ periods }: { periods: { q1: number, q2: number, q3: number, q4: number } }) => (
    <div className="flex justify-between items-center mt-3 pt-2 border-t border-surfaceVariant/30 text-[7px] font-black text-onSurfaceVariant/50 uppercase tracking-widest">
      <div className="flex flex-col items-center">
        <span>Q1</span>
        <span className="text-[9px] text-dark">{periods.q1}</span>
      </div>
      <div className="flex flex-col items-center">
        <span>Q2</span>
        <span className="text-[9px] text-dark">{periods.q2}</span>
      </div>
      <div className="flex flex-col items-center">
        <span>Q3</span>
        <span className="text-[9px] text-dark">{periods.q3}</span>
      </div>
      <div className="flex flex-col items-center">
        <span>Q4</span>
        <span className="text-[9px] text-dark">{periods.q4}</span>
      </div>
    </div>
  );


  // --- Exportar PDF Profesional ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f4f4f7',
        ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - finalWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, 10, finalWidth, finalHeight);

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Reporte_${game.teamHome.name}_vs_${game.teamAway.name}_${dateStr}.pdf`.replace(/\s+/g, '_');

      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Timestamp', 'GameTime', 'Type', 'Team', 'X', 'Y', 'Half', 'Lane', 'Details'];
    const rows = game.events.map(e => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.gameTime,
      e.type,
      e.teamId === game.teamHome.id ? 'LOCAL' : 'VISITA',
      e.x,
      e.y,
      e.half || '',
      e.lane || '',
      e.details || ''
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${game.teamHome.name}_vs_${game.teamAway.name}.csv`;
    link.click();
  };

  const homeShots = getDetailedStat(['DISPARO'], game.teamHome.id);
  const awayShots = getDetailedStat(['DISPARO'], game.teamAway.id);

  return (
    <div className="flex-1 p-6 flex flex-col gap-8 bg-surface overflow-y-auto pb-24">
      <div ref={reportRef} className="flex flex-col gap-8">
        <header className="text-center pt-4">
          <h2 className="contrail-font text-dark text-4xl mb-1 uppercase tracking-tighter">Reporte Final</h2>
          <p className="text-[10px] text-onSurfaceVariant font-black uppercase tracking-[4px] opacity-60">Data Report SportsNote • ID: {game.id}</p>
        </header>

        {/* Marcador Final */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-surfaceVariant relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary/20 rounded-b-full"></div>
          <div className="flex justify-between items-start gap-6 relative z-10">
            <div className="flex-1">
              <div className="text-[10px] text-onSurfaceVariant uppercase font-black mb-1 truncate">{game.teamHome.name}</div>
              <div className="text-6xl contrail-font text-primary drop-shadow-sm mb-4">{game.scoreHome}</div>
              <div className="space-y-1.5 border-t border-surfaceVariant pt-3">
                {getGoals(game.teamHome.id).map(g => (
                  <div key={g.id} className="text-[9px] font-bold text-onSurfaceVariant flex items-center gap-2">
                    <span className="text-primary">⚽</span>
                    <span>{g.gameTime} • {getGoalMode(g)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-black text-onSurfaceVariant text-xs border border-surfaceVariant shadow-inner">VS</div>
            </div>

            <div className="flex-1 text-right">
              <div className="text-[10px] text-onSurfaceVariant uppercase font-black mb-1 truncate">{game.teamAway.name}</div>
              <div className="text-6xl contrail-font text-dark drop-shadow-sm mb-4">{game.scoreAway}</div>
              <div className="space-y-1.5 border-t border-surfaceVariant pt-3 flex flex-col items-end">
                {getGoals(game.teamAway.id).map(g => (
                  <div key={g.id} className="text-[9px] font-bold text-onSurfaceVariant flex items-center gap-2">
                    <span>{g.gameTime} • {getGoalMode(g)}</span>
                    <span className="text-dark">⚽</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Destacado: Remates al Arco (Comparativo) */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
          <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 flex items-center gap-2 italic">
            Remates al Arco
            <div className="h-px flex-1 bg-surfaceVariant/50"></div>
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Equipo Local */}
            <div className="flex-1 bg-surface rounded-[24px] p-5 border border-surfaceVariant/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Local</span>
                <span className="text-3xl font-black text-dark">{homeShots.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Gol</p>
                  <p className="text-sm font-black text-slate-700">{homeShots.goals}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Atajado</p>
                  <p className="text-sm font-black text-slate-700">{homeShots.saved}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Desv.</p>
                  <p className="text-sm font-black text-slate-700">{homeShots.missed}</p>
                </div>
              </div>
              <PeriodRow periods={homeShots.periods} />
            </div>

            <div className="flex items-center justify-center text-onSurfaceVariant/20 font-black text-[10px] uppercase tracking-widest">Balance</div>

            {/* Equipo Visitante */}
            <div className="flex-1 bg-surface rounded-[24px] p-5 border border-surfaceVariant/50">
              <div className="flex justify-between items-center mb-4 text-right">
                <span className="text-3xl font-black text-dark">{awayShots.total}</span>
                <span className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">Recibidos</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Gol</p>
                  <p className="text-sm font-black text-dark">{awayShots.goals}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Atajado</p>
                  <p className="text-sm font-black text-dark">{awayShots.saved}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-onSurfaceVariant/60 uppercase">Desv.</p>
                  <p className="text-sm font-black text-dark">{awayShots.missed}</p>
                </div>
              </div>
              <PeriodRow periods={awayShots.periods} />
            </div>
          </div>
        </section>

        {/* Paneles Unilaterales (Pérdidas, Recuperos, Faltas) */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
          <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 italic">Balance de Acciones (Local)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Pérdidas 📉', types: ['PÉRDIDA'], color: 'text-orange-600' },
              { label: 'Recuperos 📈', types: ['RECUPERO'], color: 'text-emerald-600' },
              { label: 'Faltas ⚠️', types: ['FALTA'], color: 'text-red-600' }
            ].map(stat => {
              const data = getDetailedStat(stat.types, game.teamHome.id);

              const colorMap: { [key: string]: { text: string, bg: string, border: string, accent: string } } = {
                'text-orange-600': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-500' },
                'text-emerald-600': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-500' },
                'text-red-600': { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-500' },
                'text-slate-700': { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-500' },
              };

              const style = colorMap[stat.color] || colorMap['text-slate-700'];
              const highlightBg = style.bg.replace('50', '100'); // Más intenso para el máximo

              const halfValues = [data.own, data.rival].filter(v => v > 0);
              const maxHalfVal = halfValues.length > 0 ? Math.max(...halfValues) : -1;
              const isMaxHalf = (val: number) => val > 0 && val === maxHalfVal;

              const laneValues = [data.left, data.center, data.right].filter(v => v > 0);
              const maxLaneVal = laneValues.length > 0 ? Math.max(...laneValues) : -1;
              const isMaxLane = (val: number) => val > 0 && val === maxLaneVal;

              return (
                <div key={stat.label} className="bg-surface/30 p-5 rounded-[28px] border border-surfaceVariant flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-surfaceVariant pb-2">
                    <p className="text-[9px] font-black text-onSurfaceVariant uppercase tracking-widest">{stat.label}</p>
                    <span className={`text-2xl font-black ${style.text}`}>{data.total}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.own) ? `${highlightBg} ${style.border} shadow-sm scale-[1.02]` : 'bg-white/40 border-surfaceVariant/30'}`}>
                      <span className={`${isMaxHalf(data.own) ? style.accent : 'text-blue-500'} text-[10px]`}>↓</span>
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.own) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>Propio</span>
                        <span className={`text-[11px] font-black leading-none ${isMaxHalf(data.own) ? style.text : 'text-dark'}`}>{data.own}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMaxHalf(data.rival) ? `${highlightBg} ${style.border} shadow-sm scale-[1.02]` : 'bg-white/40 border-surfaceVariant/30'}`}>
                      <span className={`${isMaxHalf(data.rival) ? style.accent : 'text-orange-500'} text-[10px]`}>↑</span>
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-bold uppercase ${isMaxHalf(data.rival) ? style.text : 'text-onSurfaceVariant opacity-60'} leading-none`}>Rival</span>
                        <span className={`text-[11px] font-black leading-none ${isMaxHalf(data.rival) ? style.text : 'text-dark'}`}>{data.rival}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.left) ? `${highlightBg} ${style.border} shadow-sm scale-[1.02]` : 'bg-white/40 border-surfaceVariant/30'}`}>
                      <p className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.left) ? style.text : 'text-onSurfaceVariant'}`}>Izq</p>
                      <p className={`text-[10px] font-black ${isMaxLane(data.left) ? style.text : 'text-dark'}`}>{data.left}</p>
                    </div>
                    <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.center) ? `${highlightBg} ${style.border} shadow-sm scale-[1.02]` : 'bg-white/40 border-surfaceVariant/30'}`}>
                      <p className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.center) ? style.text : 'text-onSurfaceVariant'}`}>Ctr</p>
                      <p className={`text-[10px] font-black ${isMaxLane(data.center) ? style.text : 'text-dark'}`}>{data.center}</p>
                    </div>
                    <div className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isMaxLane(data.right) ? `${highlightBg} ${style.border} shadow-sm scale-[1.02]` : 'bg-white/40 border-surfaceVariant/30'}`}>
                      <p className={`text-[7px] font-black uppercase mb-0.5 ${isMaxLane(data.right) ? style.text : 'text-onSurfaceVariant'}`}>Der</p>
                      <p className={`text-[10px] font-black ${isMaxLane(data.right) ? style.text : 'text-dark'}`}>{data.right}</p>
                    </div>
                  </div>

                  <PeriodRow periods={data.periods} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Mapa de Calor (Excluido de PDF) */}
        <section data-html2canvas-ignore className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-xs font-black uppercase text-onSurfaceVariant flex items-center gap-2">
              Distribución Táctica (Heatmap)
              <div className="h-px w-12 bg-surfaceVariant"></div>
            </h3>

            <div className="flex flex-wrap gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="text-[10px] font-black uppercase bg-surface border border-surfaceVariant rounded-lg px-2 py-1 outline-none"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="DISPARO">Remates</option>
                <option value="FALTA">Faltas</option>
                <option value="PÉRDIDA">Pérdidas</option>
                <option value="RECUPERO">Recuperos</option>
              </select>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value) as any)}
                className="text-[10px] font-black uppercase bg-surface border border-surfaceVariant rounded-lg px-2 py-1 outline-none"
              >
                <option value="ALL">Todo el partido</option>
                <option value="1">1Q</option>
                <option value="2">2Q</option>
                <option value="3">3Q</option>
                <option value="4">4Q</option>
              </select>
            </div>
          </div>

          <GameField showHeatmap events={filteredEvents} />

          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-surfaceVariant shadow-sm"></div>
              <span className="text-[8px] font-black text-onSurfaceVariant uppercase tracking-widest">Actividad Registrada</span>
            </div>
          </div>
        </section>

        {/* Tendencia de Pases */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-surfaceVariant">
          <h3 className="text-xs font-black uppercase text-onSurfaceVariant mb-6 italic">Fluctuación de Pases por Período</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={passTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#6d5dfc' }}
                />
                <Line
                  type="monotone"
                  dataKey="pases"
                  stroke="#6d5dfc"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#6d5dfc', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Certificación */}
        {game.role === UserRole.ORGANIZER && (
          <div className="bg-primary/5 border-2 border-primary/10 p-6 rounded-[32px] flex items-center gap-5 shadow-inner">
            <div className="text-4xl filter drop-shadow-sm">📜</div>
            <div>
              <div className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-1">Planilla Certificada</div>
              <p className="text-[9px] text-onSurfaceVariant leading-tight font-bold uppercase opacity-60">Este reporte cuenta con firma digital SportsNote para validación en ligas oficiales.</p>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-white border-surfaceVariant text-dark h-14"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? '⏳ GENERANDO...' : '💾 PDF REPORT'}
          </Button>
          <Button variant="outline" className="flex-1 bg-white border-surfaceVariant text-dark h-14" onClick={downloadCSV}>
            📊 DATA CSV
          </Button>
        </div>
        <Button className="w-full h-14 rounded-[24px] shadow-lg shadow-primary/20" onClick={() => navigate('/dashboard')}>
          🏠 REGRESAR AL DASHBOARD
        </Button>
      </div>
    </div>
  );
};

export default SummaryView;
