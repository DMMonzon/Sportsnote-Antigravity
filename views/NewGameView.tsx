
import React, { useState } from 'react';
import { UserRole, SportType, Game } from '../types';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

interface NewGameViewProps {
  role: UserRole;
  onCreate: (game: Game) => void;
}

const COLOR_OPTIONS = [
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Gris', hex: '#6b7280' },
  { name: 'Fucsia', hex: '#d946ef' },
  { name: 'Celeste', hex: '#0ea5e9' },
  { name: 'Marrón', hex: '#78350f' },
  { name: 'Violeta', hex: '#8b5cf6' },
];

const ColorPicker: React.FC<{ 
  label: string, 
  selected: string, 
  onSelect: (hex: string) => void 
}> = ({ label, selected, onSelect }) => (
  <div className="mb-4">
    <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-2 block">{label}</label>
    <div className="grid grid-cols-6 gap-2">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.hex}
          onClick={() => onSelect(c.hex)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            selected === c.hex ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: c.hex }}
          title={c.name}
        />
      ))}
    </div>
  </div>
);

const NewGameView: React.FC<NewGameViewProps> = ({ role, onCreate }) => {
  const [teamHome, setTeamHome] = useState('Local');
  const [teamHomePrimary, setTeamHomePrimary] = useState('#3b82f6'); // Azul default
  const [teamHomeSecondary, setTeamHomeSecondary] = useState('#ffffff'); // Blanco default
  
  const [teamAway, setTeamAway] = useState('Visitante');
  const [teamAwayPrimary, setTeamAwayPrimary] = useState('#ef4444'); // Rojo default
  const [teamAwaySecondary, setTeamAwaySecondary] = useState('#ffffff'); // Blanco default
  
  const navigate = useNavigate();

  const handleStart = () => {
    const newGame: Game = {
      id: Math.random().toString(36).substr(2, 9),
      sportType: SportType.HOCKEY,
      teamHome: { 
        id: 'th', 
        name: teamHome, 
        primaryColor: teamHomePrimary, 
        secondaryColor: teamHomeSecondary, 
        players: [] 
      },
      teamAway: { 
        id: 'ta', 
        name: teamAway, 
        primaryColor: teamAwayPrimary, 
        secondaryColor: teamAwaySecondary, 
        players: [] 
      },
      scoreHome: 0,
      scoreAway: 0,
      events: [],
      isLive: true,
      duration: 0,
      role,
      createdAt: Date.now(),
      passChains: []
    };
    
    // Mock players simple
    for (let i = 1; i <= 5; i++) {
      newGame.teamHome.players.push({ id: `h${i}`, name: `Jugador ${i}`, number: i });
      newGame.teamAway.players.push({ id: `a${i}`, name: `Rival ${i}`, number: i });
    }
    onCreate(newGame);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col p-6 overflow-y-auto">
      <header className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-primary font-bold text-sm">← VOLVER</button>
        <h2 className="contrail-font text-3xl text-dark uppercase">Nuevo Match</h2>
      </header>

      <div className="flex-1 flex flex-col gap-8 pb-10">
        
        {/* INFO CARD DE CONFIGURACIÓN */}
        <section className="bg-primary/5 border border-primary/20 rounded-[28px] p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-black text-xs text-primary uppercase tracking-widest">Configuración Hockey</h3>
              <p className="text-[10px] text-onSurfaceVariant font-medium mt-1 uppercase italic opacity-70">Reglamento MVP Standard</p>
            </div>
            <button className="text-[10px] font-black text-primary hover:underline uppercase">Editar configuración del juego</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-white/50 p-2 rounded-xl text-center">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase">Periodos</p>
              <p className="text-sm font-bold text-dark">4</p>
            </div>
            <div className="bg-white/50 p-2 rounded-xl text-center">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase">Duración</p>
              <p className="text-sm font-bold text-dark">15m</p>
            </div>
            <div className="bg-white/50 p-2 rounded-xl text-center">
              <p className="text-[8px] font-black text-onSurfaceVariant uppercase">Empate</p>
              <p className="text-sm font-bold text-dark">No</p>
            </div>
          </div>
        </section>

        {/* EQUIPO LOCAL */}
        <section className="bg-surfaceVariant/20 border border-surfaceVariant rounded-[32px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🏠</span>
            <h3 className="font-black text-sm text-onSurface uppercase tracking-widest">Equipo Local</h3>
          </div>
          <div className="mb-6">
            <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-2 block">Nombre del Club</label>
            <input 
              className="w-full bg-surface border border-outline/30 p-4 rounded-2xl text-onSurface font-bold focus:border-primary outline-none shadow-inner" 
              value={teamHome}
              onChange={e => setTeamHome(e.target.value)}
              placeholder="Ej. Club Atlético"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker label="Color Primario" selected={teamHomePrimary} onSelect={setTeamHomePrimary} />
            <ColorPicker label="Color Secundario" selected={teamHomeSecondary} onSelect={setTeamHomeSecondary} />
          </div>
          <div className="mt-4 flex items-center gap-4 bg-white p-4 rounded-2xl border border-outline/10">
             <p className="text-[10px] font-black text-onSurfaceVariant uppercase">Vista previa:</p>
             <div className="flex-1 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm" style={{ backgroundColor: teamHomePrimary, color: teamHomeSecondary }}>
                {teamHome.toUpperCase()}
             </div>
          </div>
        </section>

        {/* EQUIPO VISITANTE */}
        <section className="bg-surfaceVariant/20 border border-surfaceVariant rounded-[32px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚌</span>
            <h3 className="font-black text-sm text-onSurface uppercase tracking-widest">Equipo Visitante</h3>
          </div>
          <div className="mb-6">
            <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-2 block">Nombre del Rival</label>
            <input 
              className="w-full bg-surface border border-outline/30 p-4 rounded-2xl text-onSurface font-bold focus:border-primary outline-none shadow-inner" 
              value={teamAway}
              onChange={e => setTeamAway(e.target.value)}
              placeholder="Ej. Lions Club"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker label="Color Primario" selected={teamAwayPrimary} onSelect={setTeamAwayPrimary} />
            <ColorPicker label="Color Secundario" selected={teamAwaySecondary} onSelect={setTeamAwaySecondary} />
          </div>
          <div className="mt-4 flex items-center gap-4 bg-white p-4 rounded-2xl border border-outline/10">
             <p className="text-[10px] font-black text-onSurfaceVariant uppercase">Vista previa:</p>
             <div className="flex-1 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm" style={{ backgroundColor: teamAwayPrimary, color: teamAwaySecondary }}>
                {teamAway.toUpperCase()}
             </div>
          </div>
        </section>

        <div className="mt-4">
          <Button className="w-full h-16 text-lg rounded-[28px] shadow-lg shadow-primary/20" onClick={handleStart}>
            🏑 INICIAR MATCH
          </Button>
          <p className="text-center text-[10px] text-onSurfaceVariant font-black uppercase mt-4 tracking-tighter opacity-50">Al iniciar se activará el registro en tiempo real</p>
        </div>
      </div>
    </div>
  );
};

export default NewGameView;
