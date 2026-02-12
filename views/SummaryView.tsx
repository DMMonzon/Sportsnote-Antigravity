
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Game, UserRole } from '../types';
import { dbService } from '../services/dbService';
import { Button } from '../components/Button';
import { GameField } from '../components/GameField';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const SummaryView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (id) {
      const data = dbService.getGame(id);
      if (data) setGame(data);
    }
  }, [id]);

  if (!game) return null;

  const stats = [
    { name: 'Goles', home: game.scoreHome, away: game.scoreAway },
    { name: 'Disparos', home: game.events.filter(e => e.teamId === game.teamHome.id && e.type === 'SHOT').length, away: game.events.filter(e => e.teamId === game.teamAway.id && e.type === 'SHOT').length },
    { name: 'Recuperos', home: game.events.filter(e => e.teamId === game.teamHome.id && e.type === 'RECOVERY').length, away: game.events.filter(e => e.teamId === game.teamAway.id && e.type === 'RECOVERY').length },
    { name: 'Faltas', home: game.events.filter(e => e.teamId === game.teamHome.id && e.type === 'FOUL').length, away: game.events.filter(e => e.teamId === game.teamAway.id && e.type === 'FOUL').length },
  ];

  const passStats = game.passChains.length > 0 ? {
    max: Math.max(...game.passChains),
    min: Math.min(...game.passChains),
    avg: (game.passChains.reduce((a, b) => a + b, 0) / game.passChains.length).toFixed(1)
  } : null;

  return (
    <div className="flex-1 p-6 flex flex-col gap-8 bg-bglight overflow-y-auto pb-16">
      <header className="text-center pt-4">
        <h2 className="contrail-font text-dark text-4xl mb-1">PARTIDO FINALIZADO</h2>
        <p className="text-[10px] text-grey font-bold uppercase tracking-[4px]">Data Report SportsNote</p>
      </header>

      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-grey/10 border border-grey/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary/20 rounded-b-full"></div>
        <div className="flex justify-between items-center gap-6 relative z-10">
          <div className="flex-1">
            <div className="text-[10px] text-grey uppercase font-black mb-2 truncate">{game.teamHome.name}</div>
            <div className="text-6xl contrail-font text-primary drop-shadow-md">{game.scoreHome}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-bglight flex items-center justify-center font-black text-grey">VS</div>
          <div className="flex-1 text-right">
            <div className="text-[10px] text-grey uppercase font-black mb-2 truncate">{game.teamAway.name}</div>
            <div className="text-6xl contrail-font text-dark drop-shadow-md">{game.scoreAway}</div>
          </div>
        </div>
      </div>

      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-grey/5">
        <h3 className="lato-bold text-xs uppercase text-grey mb-6 flex items-center gap-2">
          Mapa de Calor
          <div className="h-px flex-1 bg-grey/10"></div>
        </h3>
        <GameField showHeatmap events={game.events} />
        <div className="flex justify-center gap-4 mt-6">
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
             <span className="text-[10px] font-bold text-grey uppercase">Zonas de Acción</span>
           </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-grey/5 h-80">
        <h3 className="lato-bold text-xs uppercase text-grey mb-6">Comparativa de Juego</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: 'rgba(109, 93, 252, 0.05)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
            <Bar dataKey="home" fill="#6d5dfc" radius={[0, 10, 10, 0]} barSize={12} />
            <Bar dataKey="away" fill="#1e1b4b" radius={[0, 10, 10, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {passStats && (
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-grey/5 text-center">
            <div className="text-[9px] text-grey uppercase font-black mb-1">Máx</div>
            <div className="text-2xl text-primary contrail-font leading-none">{passStats.max}</div>
          </div>
          <div className="bg-primary text-white p-5 rounded-3xl shadow-lg shadow-primary/20 text-center">
            <div className="text-[9px] uppercase font-black mb-1 opacity-70 text-white">Prom</div>
            <div className="text-2xl contrail-font leading-none">{passStats.avg}</div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-grey/5 text-center">
            <div className="text-[9px] text-grey uppercase font-black mb-1">Mín</div>
            <div className="text-2xl text-primary contrail-font leading-none">{passStats.min}</div>
          </div>
        </section>
      )}

      {game.role === UserRole.ORGANIZER && (
        <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[32px] flex items-center gap-4">
          <div className="text-4xl">📜</div>
          <div>
            <div className="lato-bold text-primary uppercase text-xs mb-1">Planilla Certificada</div>
            <p className="text-[10px] text-grey leading-tight font-medium">Este reporte cuenta con firma digital SportsNote para validación en ligas oficiales.</p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-white" onClick={() => window.print()}>
          💾 PDF
        </Button>
        <Button className="flex-1" onClick={() => navigate('/dashboard')}>
          🏠 INICIO
        </Button>
      </div>

      <button className="text-grey text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 opacity-50 mb-4">
        <span>🔗</span> Copiar link de resultados
      </button>
    </div>
  );
};

export default SummaryView;
