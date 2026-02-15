import React, { useState } from 'react';
import { UserRole, SportType, Game } from '../types';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

interface NewGameViewProps {
  role: UserRole;
  onCreate: (game: Game) => void;
}

const COLOR_OPTIONS = [
  { name: 'Rojo', hex: '#FF0000' },
  { name: 'Azul', hex: '#0000FF' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Amarillo', hex: '#FFFF00' },
  { name: 'Verde', hex: '#008000' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Violeta', hex: '#8A2BE2' },
  { name: 'Fucsia', hex: '#FF00FF' },
  { name: 'Naranja', hex: '#FFA500' },
  { name: 'Celeste', hex: '#87CEEB' },
  { name: 'Marrón', hex: '#8B4513' },
];

const ColorDropdown: React.FC<{ 
  label: string, 
  selected: string, 
  onSelect: (hex: string) => void 
}> = ({ label, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedColor = COLOR_OPTIONS.find(c => c.hex === selected) || COLOR_OPTIONS[0];

  return (
    <div className="flex flex-col w-full relative" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-1.5 block">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface border border-surfaceVariant p-3 rounded-xl flex items-center justify-between text-xs font-bold text-onSurface shadow-sm hover:border-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: selectedColor.hex }}></div>
          <span>{selectedColor.name}</span>
        </div>
        <span className="text-[10px] text-primary">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-white border border-surfaceVariant rounded-2xl shadow-2xl z-[500] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-150">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.hex}
              onClick={() => { onSelect(c.hex); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors border-b border-surfaceVariant last:border-0 text-left"
            >
              <div className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }}></div>
              <span className={`text-xs ${selected === c.hex ? 'font-black text-primary' : 'font-medium text-onSurface'}`}>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TeamPreview: React.FC<{ 
  name: string, 
  primary: string, 
  secondary: string 
}> = ({ name, primary, secondary }) => (
  <div className="flex flex-col w-full">
    <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-1.5 block">Muestra de Equipo</label>
    <div 
      style={{ backgroundColor: primary, color: secondary }} 
      className="h-[46px] flex items-center justify-center rounded-xl border-2 border-surfaceVariant shadow-lg px-6 overflow-hidden transition-all duration-500"
    >
      <span className="font-black uppercase tracking-tighter text-sm truncate drop-shadow-sm">
        {name || 'NOMBRE EQUIPO'}
      </span>
    </div>
  </div>
);

const NewGameView: React.FC<NewGameViewProps> = ({ role, onCreate }) => {
  const [teamHome, setTeamHome] = useState('LOCAL');
  const [teamHomePrimary, setTeamHomePrimary] = useState('#0000FF'); 
  const [teamHomeSecondary, setTeamHomeSecondary] = useState('#FFFFFF'); 
  
  const [teamAway, setTeamAway] = useState('VISITANTE');
  const [teamAwayPrimary, setTeamAwayPrimary] = useState('#FF0000'); 
  const [teamAwaySecondary, setTeamAwaySecondary] = useState('#FFFFFF'); 
  
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
    
    for (let i = 1; i <= 11; i++) {
      newGame.teamHome.players.push({ id: `h${i}`, name: `Jugador ${i}`, number: i });
      newGame.teamAway.players.push({ id: `a${i}`, name: `Rival ${i}`, number: i });
    }
    onCreate(newGame);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col p-6 overflow-y-auto">
      <header className="mb-8 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-surfaceVariant shadow-sm hover:scale-110 transition-transform">
            <span className="text-primary font-black">←</span>
          </button>
          <h2 className="contrail-font text-3xl text-dark uppercase tracking-tighter">Preparar Partido</h2>
        </div>
        <div className="hidden sm:block">
           <span className="text-[10px] font-black text-onSurfaceVariant uppercase bg-surfaceVariant/50 px-3 py-1 rounded-full border border-surfaceVariant">Modo: {role}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-8 max-w-5xl mx-auto w-full pb-20">
        
        {/* INFO REGLAMENTO */}
        <section className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-primary/20">🏑</div>
            <div>
              <h3 className="font-black text-xs text-primary uppercase tracking-widest leading-none">Hockey sobre Césped</h3>
              <p className="text-[10px] text-onSurfaceVariant font-bold mt-1 uppercase opacity-70">FIH Oficial • 4 x 15 min</p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
             <div className="bg-white px-4 py-2 rounded-2xl border border-primary/10 text-center min-w-[80px]">
               <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-0.5">Tiempos</p>
               <p className="text-sm font-black text-primary leading-none">4</p>
             </div>
             <div className="bg-white px-4 py-2 rounded-2xl border border-primary/10 text-center min-w-[80px]">
               <p className="text-[8px] font-black text-onSurfaceVariant uppercase mb-0.5">Minutos</p>
               <p className="text-sm font-black text-primary leading-none">15'</p>
             </div>
          </div>
        </section>

        {/* CONFIGURACIÓN EQUIPO LOCAL */}
        <section className="bg-white border border-surfaceVariant rounded-[40px] p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-lg">🏠</div>
            <h3 className="font-black text-sm text-onSurface uppercase tracking-widest">Configuración Local</h3>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 lg:max-w-[240px]">
              <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-1.5 block">Nombre Equipo</label>
              <input 
                className="w-full bg-surface border border-surfaceVariant p-3 rounded-xl text-sm font-black text-onSurface focus:border-primary outline-none shadow-inner uppercase" 
                value={teamHome}
                onChange={e => setTeamHome(e.target.value)}
                placeholder="CLUB LOCAL"
              />
            </div>
            <div className="flex flex-1 gap-4">
              <ColorDropdown label="Primario" selected={teamHomePrimary} onSelect={setTeamHomePrimary} />
              <ColorDropdown label="Secundario" selected={teamHomeSecondary} onSelect={setTeamHomeSecondary} />
            </div>
            <div className="w-full lg:w-64">
              <TeamPreview name={teamHome} primary={teamHomePrimary} secondary={teamHomeSecondary} />
            </div>
          </div>
        </section>

        {/* CONFIGURACIÓN EQUIPO VISITANTE */}
        <section className="bg-white border border-surfaceVariant rounded-[40px] p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-lg">🚌</div>
            <h3 className="font-black text-sm text-onSurface uppercase tracking-widest">Configuración Visitante</h3>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 lg:max-w-[240px]">
              <label className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-1.5 block">Nombre Rival</label>
              <input 
                className="w-full bg-surface border border-surfaceVariant p-3 rounded-xl text-sm font-black text-onSurface focus:border-primary outline-none shadow-inner uppercase" 
                value={teamAway}
                onChange={e => setTeamAway(e.target.value)}
                placeholder="CLUB VISITANTE"
              />
            </div>
            <div className="flex flex-1 gap-4">
              <ColorDropdown label="Primario" selected={teamAwayPrimary} onSelect={setTeamAwayPrimary} />
              <ColorDropdown label="Secundario" selected={teamAwaySecondary} onSelect={setTeamAwaySecondary} />
            </div>
            <div className="w-full lg:w-64">
              <TeamPreview name={teamAway} primary={teamAwayPrimary} secondary={teamAwaySecondary} />
            </div>
          </div>
        </section>

        {/* BOTÓN INICIAR */}
        <div className="mt-4 flex justify-center">
          <Button 
            className="w-full lg:max-w-md h-16 text-lg rounded-[28px] shadow-2xl shadow-primary/20 group relative overflow-hidden" 
            onClick={handleStart}
          >
            <span className="relative z-10">🚀 COMENZAR REGISTRO VIVO</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewGameView;
