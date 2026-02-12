
import React from 'react';
import { UserRole, Game } from '../types';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardViewProps {
  user: { id: string; role: UserRole; name: string };
  games: Game[];
  onLogout: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, games, onLogout }) => {
  const navigate = useNavigate();

  const STATS_DATA = [
    { name: 'Wins', value: 70 },
    { name: 'Loss', value: 30 },
  ];
  const COLORS = ['#6d5dfc', '#e5e1ec'];

  // Mock for upcoming games
  const upcomingGames = [
    { id: 'u1', opponent: 'Lions HC', date: 'Hoy 18:30', field: 'C1' },
    { id: 'u2', opponent: 'Tigres Club', date: 'Mañ 16:00', field: 'C2' },
    { id: 'u3', opponent: 'Estudiantes', date: 'Vie 20:00', field: 'C1' },
    { id: 'u4', opponent: 'Univ. Hockey', date: 'Sab 11:30', field: 'C3' },
    { id: 'u5', opponent: 'C. Náutico', date: 'Dom 15:00', field: 'C1' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface overflow-y-auto">
      {/* Header MD3 */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-surface shadow-sm shrink-0 border-b border-surfaceVariant">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dark rounded-lg flex items-center justify-center text-neon font-black rotate-12">S</div>
          <h1 className="contrail-font text-xl text-dark uppercase tracking-tight">SportsNote</h1>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm font-medium text-onSurfaceVariant italic">¡Buen día, Coach!</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <p className="text-xs font-bold text-onSurface leading-none">{user.name}</p>
            <button className="text-[10px] text-primary font-bold uppercase hover:underline">Perfil</button>
          </div>
          <div className="w-10 h-10 rounded-full border border-outline/20 overflow-hidden cursor-pointer">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        
        {/* 1. MIS JUEGOS */}
        <section className="bg-surfaceVariant/30 rounded-[28px] p-5 border border-surfaceVariant flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏟️</span>
              <div>
                <h2 className="font-bold text-base text-onSurface">Mis Juegos</h2>
                <p className="text-[10px] text-onSurfaceVariant font-bold uppercase">{games.length} REGISTRADOS</p>
              </div>
            </div>
            <Button variant="primary" className="h-9 px-4" onClick={() => navigate('/new-game')}>INICIAR NUEVO</Button>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-3 flex flex-col shadow-sm max-h-[180px]">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-onSurfaceVariant uppercase">Historial</p>
                <button className="text-[9px] text-primary font-black uppercase">VER TODO</button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-[10px]">
                  <tbody className="divide-y divide-surfaceVariant">
                    {games.slice(0, 5).length > 0 ? games.slice(0, 5).map(g => (
                      <tr key={g.id}>
                        <td className="py-2 font-bold truncate pr-1">{g.teamAway.name}</td>
                        <td className="py-2 text-center font-black text-primary">{g.scoreHome}-{g.scoreAway}</td>
                        <td className="py-2 text-right text-xs">📊</td>
                      </tr>
                    )) : (
                      <tr><td className="py-4 text-center text-onSurfaceVariant italic">Sin registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-3 flex flex-col shadow-sm max-h-[180px]">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-onSurfaceVariant uppercase">Próximos</p>
                <button className="text-[9px] text-primary font-black uppercase">AGENDAR</button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  {upcomingGames.map(ug => (
                    <div key={ug.id} className="flex justify-between items-center text-[10px] border-b border-surfaceVariant/50 pb-1.5 last:border-0">
                      <div>
                        <p className="font-bold text-onSurface truncate">{ug.opponent}</p>
                        <p className="text-[8px] text-onSurfaceVariant">{ug.date} • {ug.field}</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="cursor-pointer">✏️</span>
                        <span className="cursor-pointer">🗑️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. MI EQUIPO */}
        <section className="bg-surfaceVariant/30 rounded-[28px] p-5 border border-surfaceVariant flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <h2 className="font-bold text-base text-onSurface">Mi Equipo</h2>
                <p className="text-[10px] text-onSurfaceVariant font-bold uppercase">18 JUGADORES</p>
              </div>
            </div>
            <Button variant="primary" className="h-9 px-4">ACCEDER PLANTEL</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-3 flex flex-col justify-between shadow-sm min-h-[100px]">
              <div>
                <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase">Dorsales</h4>
                <p className="text-xs font-medium text-onSurface mt-1">Último: #14 - Lopez</p>
              </div>
              <button className="text-[9px] font-black text-primary uppercase text-left">EDITAR DORSALES</button>
            </div>
            <div className="bg-surface rounded-2xl p-3 flex flex-col justify-between shadow-sm min-h-[100px]">
              <div>
                <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase">Jugadores</h4>
                <p className="text-xs font-medium text-onSurface mt-1">García, Manuel</p>
              </div>
              <button className="text-[9px] font-black text-primary uppercase text-left">REGISTRAR NUEVO</button>
            </div>
          </div>
        </section>

        {/* 3. MIS ESTADÍSTICAS */}
        <section className="bg-surfaceVariant/30 rounded-[28px] p-5 border border-surfaceVariant flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h2 className="font-bold text-base text-onSurface">Estadísticas</h2>
                <p className="text-[10px] text-onSurfaceVariant font-bold uppercase">RENDIMIENTO PRO</p>
              </div>
            </div>
            <Button variant="primary" className="h-9 px-4">VER TOTALES</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-2 flex flex-col items-center justify-between shadow-sm min-h-[120px]">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase self-start">Por Jugador</p>
              <div className="w-14 h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={STATS_DATA} innerRadius={14} outerRadius={24} dataKey="value" paddingAngle={5}>
                      {STATS_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <button className="text-[9px] font-black text-primary uppercase">Stats Jugadores</button>
            </div>
            <div className="bg-surface rounded-2xl p-2 flex flex-col items-center justify-between shadow-sm min-h-[120px]">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase self-start">Por Acción</p>
              <div className="w-full h-12 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[{v:10},{v:25},{v:15},{v:30}]}>
                    <Line type="monotone" dataKey="v" stroke="#6d5dfc" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <button className="text-[9px] font-black text-primary uppercase">Stats Acciones</button>
            </div>
          </div>
        </section>

        {/* 4. MIS AJUSTES */}
        <section className="bg-surfaceVariant/30 rounded-[28px] p-5 border border-surfaceVariant flex flex-col mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h2 className="font-bold text-base text-onSurface">Ajustes</h2>
                <p className="text-[10px] text-onSurfaceVariant font-bold uppercase">HOCKEY • STANDARD</p>
              </div>
            </div>
            <Button variant="primary" className="h-9 px-4">CONFIGURAR</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-3 flex flex-col justify-between shadow-sm min-h-[100px]">
              <div>
                <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase">Distribución</h4>
                <p className="text-xs font-medium text-onSurface mt-1">4 Listas activas</p>
              </div>
              <button className="text-[9px] font-black text-primary uppercase text-left">EDITAR LISTAS</button>
            </div>
            <div className="bg-surface rounded-2xl p-3 flex flex-col justify-between shadow-sm min-h-[100px]">
              <div>
                <h4 className="text-[9px] font-black text-onSurfaceVariant uppercase">Acciones</h4>
                <p className="text-xs font-medium text-onSurface mt-1">12 Tipos de acción</p>
              </div>
              <button className="text-[9px] font-black text-primary uppercase text-left">EDITAR ACCIONES</button>
            </div>
          </div>
        </section>

      </main>

      <footer className="px-6 py-4 flex flex-col items-center shrink-0 border-t border-surfaceVariant bg-surface">
          <button onClick={onLogout} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-full">
            Cerrar Sesión
          </button>
      </footer>
    </div>
  );
};

export default DashboardView;
