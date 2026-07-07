import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, UserRole, GameEvent, TacticalScheme } from '../types';
import { PersistenceManager } from '../services/PersistenceManager';
import { Button } from '../components/Button';
import { Breadcrumb } from '../components/Breadcrumb';
import { GlassCard } from '../components/GlassCard';
import { GameField } from '../components/GameField';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  
  if (hex.startsWith('rgb')) {
    const parts = hex.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
  }

  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EntryAnalysisCard: React.FC<{
  title: string;
  homeTotal: number;
  awayTotal: number;
  homeColor: string;
  awayColor: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, homeTotal, awayTotal, homeColor, awayColor, icon, children }) => {
  const total = homeTotal + awayTotal;
  const homePct = total > 0 ? (homeTotal / total) * 100 : 50;
  const awayPct = total > 0 ? (awayTotal / total) * 100 : 50;

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {/* Fila Superior */}
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-2">
            {icon && <span className="text-white flex items-center">{icon}</span>}
            <h4 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">{title}</h4>
          </div>
          <div className="text-xl font-black text-white tracking-tight italic">
            {homeTotal} <span className="text-white/40">/</span> {awayTotal}
          </div>
        </div>

        {/* Versus Progress Bar */}
        <div className="w-full flex flex-col gap-1">
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
            <div 
              className="h-full transition-all duration-500 ease-out" 
              style={{ width: `${homePct}%`, backgroundColor: homeColor }}
            />
            <div 
              className="h-full transition-all duration-500 ease-out" 
              style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
            />
          </div>
          {/* Fila Inferior */}
          <div className="flex justify-between items-center text-[10px] font-medium text-white/40 px-0.5">
            <span>{homeTotal}</span>
            <span>{awayTotal}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-6 py-2 border-t border-white/10 pt-4">
        {children}
      </div>
    </GlassCard>
  );
};

const VersusStatCard: React.FC<{
  title: string;
  homeValue: number;
  awayValue: number;
  homeColor: string;
  awayColor: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  isSingleTeam?: boolean;
}> = ({ title, homeValue, awayValue, homeColor, awayColor, icon, children, isSingleTeam = false }) => {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPct = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <GlassCard className="p-5 flex flex-col gap-4 shadow-lg hover:scale-[1.01] transition-transform duration-200">
      <div className="flex flex-col gap-2">
        {/* Fila Superior */}
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-2">
            {icon && <span className="text-white flex items-center">{icon}</span>}
            <h4 className="contrail-font text-[15px] font-black text-white uppercase tracking-wider">{title}</h4>
          </div>
          <div className="text-xl font-black text-white tracking-tight italic">
            {isSingleTeam ? (
              homeValue
            ) : (
              <>
                {homeValue} <span className="text-white/40">/</span> {awayValue}
              </>
            )}
          </div>
        </div>

        {/* Versus Progress Bar */}
        {!isSingleTeam && (
          <div className="w-full flex flex-col gap-1">
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
              <div 
                className="h-full transition-all duration-500 ease-out" 
                style={{ width: `${homePct}%`, backgroundColor: homeColor }}
              />
              <div 
                className="h-full transition-all duration-500 ease-out" 
                style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
              />
            </div>
            {/* Fila Inferior */}
            <div className="flex justify-between items-center text-[10px] font-medium text-white/40 px-0.5">
              <span>{homeValue}</span>
              <span>{awayValue}</span>
            </div>
          </div>
        )}
      </div>

      {children && (
        <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
          {children}
        </div>
      )}
    </GlassCard>
  );
};

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
      <p className="font-lato text-[15px] font-bold text-white uppercase tracking-wider">{label}</p>
      <div className={`w-full overflow-hidden flex flex-col ${borderPosition === 'top' ? 'flex-col-reverse' : 'flex-col'}`}>
        <div 
          className={`w-full h-12 bg-white/5 border border-white/10 flex overflow-hidden ${
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
                className={`flex-1 border-r last:border-r-0 border-white/10 flex flex-col items-center justify-center transition-all ${cellRoundedClass} ${active ? 'bg-[#00fe00]/20' : ''}`}
              >
                <span className={`text-[16px] font-black ${active ? 'text-[#00fe00]' : 'text-white/40'}`}>
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
  const homeColor = game ? (game.teamHome.primaryColor || game.teamHome.color || '#3b82f6') : '#3b82f6';
  const awayColor = game ? (game.teamAway.primaryColor || game.teamAway.color || '#ef4444') : '#ef4444';
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [actionFilter, setActionFilter] = useState<'ALL' | 'DISPARO' | 'FALTA' | 'PÉRDIDA' | 'RECUPERO'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');

  const [heatmapPeriod, setHeatmapPeriod] = useState<string>('ALL');
  const [heatmapAction, setHeatmapAction] = useState<string>('ALL');

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

  const filteredHeatmapEvents = useMemo(() => {
    if (!game) return [];
    return game.events.filter(e => {
      if (e.x === undefined || e.y === undefined || e.x === null || e.y === null || isNaN(e.x) || isNaN(e.y)) {
        return false;
      }

      if (heatmapPeriod !== 'ALL') {
        if (!e.gameTime.startsWith(heatmapPeriod)) {
          return false;
        }
      }

      if (heatmapAction !== 'ALL') {
        const typeUpper = e.type.toUpperCase();
        if (heatmapAction === 'GOL') {
          if (!typeUpper.includes('GOL')) return false;
        } else if (heatmapAction === 'FALTA') {
          if (!typeUpper.includes('FALTA')) return false;
        } else if (heatmapAction === 'CORTO') {
          if (!typeUpper.includes('CÓRNER CORTO') && !typeUpper.includes('CORTO')) return false;
        } else if (heatmapAction === 'PENAL') {
          if (!typeUpper.includes('PENAL')) return false;
        } else if (heatmapAction === 'PERDIDA') {
          if (!typeUpper.includes('PÉRDIDA') && !typeUpper.includes('PERDIDA') && !typeUpper.includes('TURNOVER')) return false;
        } else if (heatmapAction === 'RECUPERO') {
          if (!typeUpper.includes('RECUPERO')) return false;
        }
      }

      return true;
    });
  }, [game, heatmapPeriod, heatmapAction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';

      const radius = Math.max(15, canvas.width * 0.05);

      filteredHeatmapEvents.forEach(e => {
        const px = (e.y / 100) * canvas.width;
        const py = (e.x / 100) * canvas.height;
        const baseColor = e.teamId === game?.teamHome.id ? homeColor : awayColor;

        ctx.filter = 'blur(14px)';

        const grad = ctx.createRadialGradient(px, py, 1, px, py, radius);
        grad.addColorStop(0, hexToRgba(baseColor, 0.45));
        grad.addColorStop(0.3, hexToRgba(baseColor, 0.20));
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    };

    updateCanvas();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvas();
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [filteredHeatmapEvents, homeColor, awayColor, game]);

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
    <div className="flex-1 flex items-center justify-center min-h-screen relative z-10">
      <p className="text-white/50 font-black uppercase tracking-widest animate-pulse">Cargando Reporte...</p>
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
        return e.type.toUpperCase().includes(t.toUpperCase());
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
    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10 text-[7px] font-black text-white/50 uppercase tracking-widest">
      {['1', '2', '3', '4'].map(q => (
        <div key={q} className="flex flex-col items-center">
          <span>Q{q}</span>
          <span className="text-[9px] text-white">{(periods as any)[`q${q}`]}</span>
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

  const isJournalist = game.registroMode === 'botones';
  const getHalfLabel = (halfType: 'own' | 'rival', isHomeTeam: boolean) => {
    if (isJournalist) {
      if (halfType === 'own') {
        return isHomeTeam ? `Campo ${game.teamHome.name}` : `Campo ${game.teamAway.name}`;
      } else {
        return isHomeTeam ? `Campo ${game.teamAway.name}` : `Campo ${game.teamHome.name}`;
      }
    } else {
      return halfType === 'own' ? 'Propio' : 'Rival';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col overflow-y-auto no-scrollbar pb-16 relative z-10">
      <div className="pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full mb-8">
        <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Reporte Final' }]} />
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full flex flex-col gap-8 px-4 md:px-8">
        <div ref={reportRef} className="flex flex-col gap-8">
          <header className="text-center pt-4">
            <h2 className="contrail-font text-white text-4xl mb-1 uppercase tracking-tighter">Reporte Final</h2>
            <p className="text-[10px] text-white/50 font-black uppercase tracking-[4px] opacity-60">Data Report SportNotes • ID: {game.id}</p>
          </header>

          <GlassCard className="p-8 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start gap-6 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <div className="text-[10px] text-white/50 uppercase font-black mb-1 truncate">{game.teamHome.name}</div>
                <div className="text-6xl contrail-font text-[#00fe00] drop-shadow-sm mb-4">{game.scoreHome}</div>
                <div className="space-y-1.5 border-t border-white/10 pt-3">
                  {getGoals(game.teamHome.id).map(g => (
                    <div key={g.id} className="text-[9px] font-bold text-white/70 flex items-center gap-2 justify-center md:justify-start">
                      <span className="text-[#00fe00]"><i className="fa-solid fa-futbol"></i></span>
                      <span>{g.gameTime} • {getGoalMode(g)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center h-full pt-8">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-black text-white/50 text-xs border border-white/10">VS</div>
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="text-[10px] text-white/50 uppercase font-black mb-1 truncate">{game.teamAway.name}</div>
                <div className="text-6xl contrail-font text-white drop-shadow-sm mb-4">{game.scoreAway}</div>
                <div className="space-y-1.5 border-t border-white/10 pt-3 flex flex-col items-center md:items-end">
                  {getGoals(game.teamAway.id).map(g => (
                    <div key={g.id} className="text-[9px] font-bold text-white/70 flex items-center gap-2 justify-center md:justify-end">
                      <span>{g.gameTime} • {getGoalMode(g)}</span>
                      <span className="text-white"><i className="fa-solid fa-futbol"></i></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <VersusStatCard
            title="Remates Totales"
            icon={<i className="fa-solid fa-futbol text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
            homeValue={homeShots.total}
            awayValue={awayShots.total}
            homeColor={homeColor}
            awayColor={awayColor}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local */}
              <div className="flex flex-col gap-2">
                <span className="font-lato text-xs font-black text-white uppercase tracking-wider opacity-60">{game.teamHome.name}</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Gol</p>
                    <p className="text-sm font-black text-white">{homeShots.goals} <span className="text-[9px] opacity-50">({getPct(homeShots.goals, homeShots.total)}%)</span></p>
                  </div>
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Atajado</p>
                    <p className="text-sm font-black text-white">{homeShots.saved} <span className="text-[9px] opacity-50">({getPct(homeShots.saved, homeShots.total)}%)</span></p>
                  </div>
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Desv.</p>
                    <p className="text-sm font-black text-white">{homeShots.missed} <span className="text-[9px] opacity-50">({getPct(homeShots.missed, homeShots.total)}%)</span></p>
                  </div>
                </div>
              </div>

              {/* Visitante */}
              <div className="flex flex-col gap-2">
                <span className="font-lato text-xs font-black text-white uppercase tracking-wider opacity-60">{game.teamAway.name}</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Gol</p>
                    <p className="text-sm font-black text-white">{awayShots.goals} <span className="text-[9px] opacity-50">({getPct(awayShots.goals, awayShots.total)}%)</span></p>
                  </div>
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Atajado</p>
                    <p className="text-sm font-black text-white">{awayShots.saved} <span className="text-[9px] opacity-50">({getPct(awayShots.saved, awayShots.total)}%)</span></p>
                  </div>
                  <div className="text-center bg-white/5 p-2 rounded-xl shadow-sm border border-white/10">
                    <p className="font-lato text-[11px] font-bold text-white opacity-60 uppercase mb-0.5">Desv.</p>
                    <p className="text-sm font-black text-white">{awayShots.missed} <span className="text-[9px] opacity-50">({getPct(awayShots.missed, awayShots.total)}%)</span></p>
                  </div>
                </div>
              </div>
            </div>
          </VersusStatCard>

          <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
              <div className="w-full">
                <h3 className="contrail-font text-[15px] font-black uppercase text-white mb-4 italic">Balance de Acciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Pérdidas', icon: <i className="fa-solid fa-arrow-trend-down text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>, types: ['PÉRDIDA', 'PERDIDA', 'TURNOVER'] },
                    { label: 'Recuperos', icon: <i className="fa-solid fa-arrow-trend-up text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>, types: ['RECUPERO'] },
                    { label: 'Faltas', icon: <i className="fa-solid fa-triangle-exclamation text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>, types: ['FALTA'] }
                  ].map(stat => {
                    const localData = getDetailedStat(stat.types, game.teamHome.id);
                    const awayData = getDetailedStat(stat.types, game.teamAway.id);
                    const isSingleTeam = !isJournalist && (stat.label === 'Pérdidas' || stat.label === 'Recuperos');
                    return (
                      <VersusStatCard
                        key={stat.label}
                        title={stat.label}
                        icon={stat.icon}
                        homeValue={localData.total}
                        awayValue={awayData.total}
                        homeColor={homeColor}
                        awayColor={awayColor}
                        isSingleTeam={isSingleTeam}
                      >
                        <div className={isSingleTeam ? "w-full text-left" : "grid grid-cols-2 gap-4 text-left"}>
                          {/* Local Details */}
                          <div className="flex flex-col gap-2 w-full">
                            <span className="font-lato text-[11px] font-black text-white uppercase tracking-wider opacity-60">
                              {isJournalist ? game.teamHome.name : 'Local (Propio)'}
                            </span>
                            <div className={isSingleTeam ? "grid grid-cols-2 gap-3 text-[10px]" : "grid grid-cols-2 gap-1 text-[10px]"}>
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-blue-400">↓</span>
                                <div className="flex flex-col">
                                  <span className="opacity-60 text-white text-[8px] truncate">
                                    {getHalfLabel('own', true)}
                                  </span>
                                  <span className="font-black text-white">{localData.own}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-orange-400">↑</span>
                                <div className="flex flex-col">
                                  <span className="opacity-60 text-white text-[8px] truncate">
                                    {getHalfLabel('rival', true)}
                                  </span>
                                  <span className="font-black text-white">{localData.rival}</span>
                                </div>
                              </div>
                            </div>
                            <PeriodRow periods={localData.periods} />
                          </div>

                          {/* Visitor Details */}
                          {!isSingleTeam && (
                            <div className="flex flex-col gap-2">
                              <span className="font-lato text-[11px] font-black text-white uppercase tracking-wider opacity-60">
                                {isJournalist ? game.teamAway.name : 'Visita (Rival)'}
                              </span>
                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                                  <span className="text-blue-400">↓</span>
                                  <div className="flex flex-col">
                                    <span className="opacity-60 text-white text-[8px] truncate">
                                      {getHalfLabel('own', false)}
                                    </span>
                                    <span className="font-black text-white">{awayData.own}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                                  <span className="text-orange-400">↑</span>
                                  <div className="flex flex-col">
                                    <span className="opacity-60 text-white text-[8px] truncate">
                                      {getHalfLabel('rival', false)}
                                    </span>
                                    <span className="font-black text-white">{awayData.rival}</span>
                                  </div>
                                </div>
                              </div>
                              <PeriodRow periods={awayData.periods} />
                            </div>
                          )}
                        </div>
                      </VersusStatCard>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="contrail-font text-[15px] font-black uppercase text-white mb-6 flex items-center gap-2 italic">Ingresos y Accesos Ofensivos <div className="h-px flex-1 bg-white/10"></div></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EntryAnalysisCard
                title="Ingresos al Área"
                icon={<i className="fa-solid fa-arrow-right-to-bracket text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                homeTotal={Object.values(statsArea.home).reduce((a: number, b: number) => a + b, 0)}
                awayTotal={Object.values(statsArea.away).reduce((a: number, b: number) => a + b, 0)}
                homeColor={homeColor}
                awayColor={awayColor}
              >
                <SectorRectangle
                  label={isJournalist ? `Ingresos de ${game.teamHome.name} al área de ${game.teamAway.name}` : "Ingresos al área rival"}
                  teamColor={awayColor}
                  stats={statsArea.home}
                  sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                  borderPosition="top"
                />
                <SectorRectangle
                  label={isJournalist ? `Ingresos de ${game.teamAway.name} al área de ${game.teamHome.name}` : "Ingresos del rival a mi área"}
                  teamColor={homeColor}
                  stats={statsArea.away}
                  sectors={['Extremo Izquierdo', 'Centro Izquierda', 'Centro', 'Centro Derecha', 'Extremo Derecho']}
                  borderPosition="bottom"
                />
              </EntryAnalysisCard>

              <EntryAnalysisCard
                title="Ingresos a 23 Yardas"
                icon={<i className="fa-solid fa-bezier-curve text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i>}
                homeTotal={Object.values(stats23.home).reduce((a: number, b: number) => a + b, 0)}
                awayTotal={Object.values(stats23.away).reduce((a: number, b: number) => a + b, 0)}
                homeColor={homeColor}
                awayColor={awayColor}
              >
                <SectorRectangle
                  label={isJournalist ? `Ingresos de ${game.teamHome.name} a 23 yardas de ${game.teamAway.name}` : "Ingresos a 23 yardas rival"}
                  teamColor={awayColor}
                  stats={stats23.home}
                  sectors={['Izquierda', 'Centro', 'Derecha']}
                  borderPosition="top"
                  type="zone23"
                />
                <SectorRectangle
                  label={isJournalist ? `Ingresos del rival a mis 23 yardas` : "Ingresos del rival a mis 23 yardas"}
                  teamColor={homeColor}
                  stats={stats23.away}
                  sectors={['Izquierda', 'Centro', 'Derecha']}
                  borderPosition="bottom"
                  type="zone23"
                />
              </EntryAnalysisCard>
            </div>
          </GlassCard>

          {/* Mapa de Calor del Partido (Disponible sólo en modo Entrenador cuando se usó el registro Visual) */}
          {game.registroMode !== 'botones' && (
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="contrail-font text-[15px] font-black uppercase text-white flex items-center gap-2 italic">
                  <i className="fa-solid fa-fire text-[#ff5a00] text-lg"></i> Mapa de Calor del Partido
                </h3>
                
                {/* Selectores de Filtro */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">Período</span>
                    <select
                      value={heatmapPeriod}
                      onChange={(e) => setHeatmapPeriod(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer hover:bg-white/10 focus:border-white/30"
                    >
                      <option value="ALL" className="bg-[#0f172a] text-white">Todos</option>
                      <option value="1Q" className="bg-[#0f172a] text-white">1º Cuarto</option>
                      <option value="2Q" className="bg-[#0f172a] text-white">2º Cuarto</option>
                      <option value="3Q" className="bg-[#0f172a] text-white">3º Cuarto</option>
                      <option value="4Q" className="bg-[#0f172a] text-white">4º Cuarto</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">Acción</span>
                    <select
                      value={heatmapAction}
                      onChange={(e) => setHeatmapAction(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer hover:bg-white/10 focus:border-white/30"
                    >
                      <option value="ALL" className="bg-[#0f172a] text-white">Todas</option>
                      <option value="GOL" className="bg-[#0f172a] text-white">Goles</option>
                      <option value="FALTA" className="bg-[#0f172a] text-white">Faltas Cometidas</option>
                      <option value="CORTO" className="bg-[#0f172a] text-white">Córner Corto</option>
                      <option value="PENAL" className="bg-[#0f172a] text-white">Penales</option>
                      <option value="PERDIDA" className="bg-[#0f172a] text-white">Pérdidas</option>
                      <option value="RECUPERO" className="bg-[#0f172a] text-white">Recuperos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cancha Horizontal */}
              <div className="relative w-full aspect-[3/2] md:aspect-[8/5] bg-emerald-800 rounded-[24px] overflow-hidden border-2 border-white/20 shadow-inner">
                {/* Textura de césped */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]"></div>
                
                {/* Línea Central */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full" />
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />

                {/* Líneas de 23 Metros (Punteadas) */}
                <div className="absolute left-[25%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30" />
                <div className="absolute right-[25%] top-0 bottom-0 w-px border-r-2 border-dashed border-white/30" />

                {/* Áreas de Tiro (D) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[32%] h-[53.2%] border border-white/30 rounded-full -translate-x-1/2" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[32%] h-[53.2%] border border-white/30 rounded-full translate-x-1/2" />

                {/* Puntos de Penal */}
                <div className="absolute left-[14%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="absolute right-[14%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/40" />

                {/* Arcos */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[1.5%] h-[20%] border-y-2 border-r-2 rounded-r transition-all duration-300" 
                  style={{ 
                    backgroundColor: hexToRgba(awayColor, 0.35), 
                    borderColor: awayColor,
                    boxShadow: `0 0 10px ${hexToRgba(awayColor, 0.5)}`
                  }} 
                  title={`Arco defendido por ${game.teamAway.name}`}
                />
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[1.5%] h-[20%] border-y-2 border-l-2 rounded-l transition-all duration-300" 
                  style={{ 
                    backgroundColor: hexToRgba(homeColor, 0.35), 
                    borderColor: homeColor,
                    boxShadow: `0 0 10px ${hexToRgba(homeColor, 0.5)}`
                  }} 
                  title={`Arco defendido por ${game.teamHome.name}`}
                />

                {/* Capa del Canvas del Mapa de Calor (Estelas de Densidad) */}
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  style={{ mixBlendMode: 'screen' }} 
                />

                {/* Puntos de Acción */}
                {filteredHeatmapEvents.map((e) => (
                  <div
                    key={e.id}
                    className="absolute w-3.5 h-3.5 rounded-full border border-white/60 shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-150 cursor-pointer"
                    style={{
                      left: `${e.y}%`,
                      top: `${e.x}%`,
                      backgroundColor: e.teamId === game.teamHome.id ? homeColor : awayColor,
                      boxShadow: `0 0 10px ${e.teamId === game.teamHome.id ? homeColor : awayColor}`,
                    }}
                    title={`${e.type} - ${e.teamId === game.teamHome.id ? game.teamHome.name : game.teamAway.name} (${e.gameTime})`}
                  />
                ))}

                {filteredHeatmapEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Sin eventos para mostrar</span>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <h3 className="contrail-font text-[15px] font-black uppercase text-white mb-6 flex items-center gap-2 italic">
              <i className="fa-solid fa-magnifying-glass-arrow-right text-white text-lg" style={{ color: '#ffffff', opacity: 1 }}></i> Fluctuación de Pases por Período <div className="h-px flex-1 bg-white/10"></div>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={passTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fill="#ffffff" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fill="#ffffff" />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="pases" stroke="#00fe00" strokeWidth={4} dot={{ r: 6, fill: '#00fe00', strokeWidth: 2, stroke: '#1a1a1a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-14" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>{isGeneratingPDF ? '⏳ GENERANDO...' : '💾 PDF REPORT'}</Button>
            <Button variant="outline" className="flex-1 bg-[#00fe00]/10 border-[#00fe00]/30 text-[#00fe00] hover:bg-[#00fe00]/20 h-14" onClick={handleCopySummary}>📋 COPIAR RESUMEN</Button>
            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 h-14" onClick={downloadCSV}>📊 DATA CSV</Button>
          </div>
          <Button className="w-full h-14 bg-[#00fe00] text-black hover:bg-[#00fe00]/80 rounded-[24px] shadow-[0_0_20px_rgba(0,254,0,0.3)] font-black uppercase tracking-widest" onClick={() => navigate('/dashboard')}>🏠 REGRESAR AL DASHBOARD</Button>
        </div>
      </main>
    </div>
  );
};

export default SummaryView;
