
import React, { useState } from 'react';
import { UserRole, SportType, Game } from '../types';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { useNavigate, useLocation } from 'react-router-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';
import { db, collection, doc } from '../services/firebase';

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
      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-white shadow-sm hover:border-[#00fe00] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: selectedColor.hex }}></div>
          <span>{selectedColor.name}</span>
        </div>
        <span className="text-[10px] text-[#00fe00]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#131041] border border-white/10 rounded-2xl shadow-2xl z-[500] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-150">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.hex}
              onClick={() => { onSelect(c.hex); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/10 last:border-0 text-left"
            >
              <div className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }}></div>
              <span className={`text-xs ${selected === c.hex ? 'font-black text-[#00fe00]' : 'font-medium text-white/80'}`}>{c.name}</span>
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
    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Muestra de Equipo</label>
    <div
      style={{ backgroundColor: primary, color: secondary }}
      className="h-[46px] flex items-center justify-center rounded-xl border border-white/10 shadow-lg px-6 overflow-hidden transition-all duration-500"
    >
      <span className="font-black uppercase tracking-tighter text-sm truncate drop-shadow-sm">
        {name || 'NOMBRE EQUIPO'}
      </span>
    </div>
  </div>
);

const NewGameView: React.FC<NewGameViewProps> = ({ role, onCreate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template as Game | undefined;

  const [teamHome, setTeamHome] = useState(template?.teamHome.name || 'LOCAL');
  const [teamHomePrimary, setTeamHomePrimary] = useState(template?.teamHome.primaryColor || '#0000FF');
  const [teamHomeSecondary, setTeamHomeSecondary] = useState(template?.teamHome.secondaryColor || '#FFFFFF');

  const [teamAway, setTeamAway] = useState(template?.teamAway.name || 'VISITANTE');
  const [teamAwayPrimary, setTeamAwayPrimary] = useState(template?.teamAway.primaryColor || '#FF0000');
  const [teamAwaySecondary, setTeamAwaySecondary] = useState(template?.teamAway.secondaryColor || '#FFFFFF');

  const [registroMode, setRegistroMode] = useState<'visual' | 'botones'>('visual');

  const handleStart = () => {
    const newGameId = doc(collection(db, 'matches')).id;
    const newGame: Game = {
      id: newGameId,
      sportType: SportType.HOCKEY,
      registroMode,
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
    telemetryService.logEvent(TelemetryEvent.START_GAME, {
      gameId: newGame.id,
      teams: `${newGame.teamHome.name} vs ${newGame.teamAway.name}`
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 overflow-y-auto relative z-10 w-full">
      <header className="mb-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Preparar Partido' }]} />
        <div className="hidden sm:block mb-6">
          <span className="text-[10px] font-black text-white/50 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">Modo: {role}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full pb-20">

        {/* INFO REGLAMENTO */}
        <GlassCard className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00fe00]/20 rounded-2xl flex items-center justify-center text-[#00fe00] text-2xl shadow-lg border border-[#00fe00]/20"><i className="fa-solid fa-play ml-1"></i></div>
            <div>
              <h3 className="font-black text-xs text-white uppercase tracking-widest leading-none">Hockey sobre Césped</h3>
              <p className="text-[10px] text-white/50 font-bold mt-1 uppercase">FIH Oficial • 4 x 15 min</p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-center min-w-[80px]">
              <p className="text-[8px] font-black text-white/50 uppercase mb-0.5">Tiempos</p>
              <p className="text-sm font-black text-[#00fe00] leading-none">4</p>
            </div>
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-center min-w-[80px]">
              <p className="text-[8px] font-black text-white/50 uppercase mb-0.5">Minutos</p>
              <p className="text-sm font-black text-[#00fe00] leading-none">15'</p>
            </div>
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <p className="text-[8px] font-black text-white/50 uppercase mb-0.5">Igualdad</p>
              <p className="text-[10px] font-black text-[#00fe00] leading-none uppercase">Sin desempate</p>
            </div>
          </div>
        </GlassCard>

        {/* CONFIGURACIÓN EQUIPO LOCAL */}
        <GlassCard className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-house"></i></div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest">Configuración Local</h3>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 lg:max-w-[240px]">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Nombre Equipo</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-[#00fe00] outline-none shadow-inner uppercase"
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
        </GlassCard>

        {/* CONFIGURACIÓN EQUIPO VISITANTE */}
        <GlassCard className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm"><i className="fa-solid fa-bus"></i></div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest">Configuración Visitante</h3>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 lg:max-w-[240px]">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Nombre Rival</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-[#00fe00] outline-none shadow-inner uppercase"
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
        </GlassCard>

        {/* MODALIDAD DE REGISTRO */}
        <GlassCard className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm"><i className="fa-solid fa-sliders"></i></div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest font-contrail">Modalidad de Registro</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setRegistroMode('visual')}
              className={`p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 ${
                registroMode === 'visual'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#38bdf8]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  registroMode === 'visual' ? 'border-[#38bdf8]' : 'border-white/30'
                }`}>
                  {registroMode === 'visual' && <div className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
                </div>
                <span className="font-black text-xs text-white uppercase tracking-wider">Modo Visual</span>
              </div>
              <p className="text-[10px] text-white/60 font-bold leading-normal uppercase">
                Registro táctico interactivo mediante el mapa de juego dinámico.
              </p>
            </button>

            <button
              onClick={() => setRegistroMode('botones')}
              className={`p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 ${
                registroMode === 'botones'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-white/5 border-white/10 hover:border-[#38bdf8]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  registroMode === 'botones' ? 'border-[#38bdf8]' : 'border-white/30'
                }`}>
                  {registroMode === 'botones' && <div className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
                </div>
                <span className="font-black text-xs text-white uppercase tracking-wider">Modo Botones</span>
              </div>
              <p className="text-[10px] text-white/60 font-bold leading-normal uppercase">
                Registro rápido y tradicional mediante botones segmentados por cuadrantes espaciales.
              </p>
            </button>
          </div>
        </GlassCard>

        {/* BOTÓN INICIAR */}
        <div className="mt-4 flex justify-center">
          <button
            className="bg-[#b4b4b4] text-black px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#c0c0c0] transition-all active:scale-95 flex items-center justify-center gap-3 w-full lg:max-w-md shadow-[0_0_20px_rgba(180,180,180,0.2)]"
            onClick={handleStart}
          >
            COMENZAR JUEGO <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGameView;
