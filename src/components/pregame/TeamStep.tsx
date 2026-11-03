import React, { useState } from 'react';
import { UserRole, Player } from '../../../types';

export const COLOR_OPTIONS = [
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

export const ColorDropdown: React.FC<{
  label: string;
  selected: string;
  onSelect: (hex: string) => void;
}> = ({ label, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedColor = COLOR_OPTIONS.find(c => c.hex.toLowerCase() === selected.toLowerCase()) || COLOR_OPTIONS[0];

  return (
    <div className="flex flex-col w-full relative" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-white shadow-sm hover:border-[#c6ff00] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: selectedColor.hex }}></div>
          <span>{selectedColor.name}</span>
        </div>
        <span className="text-[10px] text-[#c6ff00]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#1c1236] border border-white/10 rounded-2xl shadow-2xl z-[500] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-150">
          {COLOR_OPTIONS.map((c) => (
            <button
              type="button"
              key={c.hex}
              onMouseDown={() => { onSelect(c.hex); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/10 last:border-0 text-left cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }}></div>
              <span className={`text-xs ${selected.toLowerCase() === c.hex.toLowerCase() ? 'font-black text-[#c6ff00]' : 'font-medium text-white/85'}`}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TeamPreview: React.FC<{
  name: string;
  primary: string;
  secondary: string;
}> = ({ name, primary, secondary }) => (
  <div className="flex flex-col w-full">
    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
      Muestra de Equipo
    </label>
    <div
      style={{ backgroundColor: primary, color: secondary }}
      className="h-[54px] flex items-center justify-center rounded-2xl border border-white/10 shadow-lg px-6 overflow-hidden transition-all duration-300"
    >
      <span className="font-black uppercase tracking-tight text-base truncate drop-shadow-sm font-sans">
        {name || 'NOMBRE EQUIPO'}
      </span>
    </div>
  </div>
);

export const PlayerListEditor: React.FC<{
  title: string;
  players: Player[];
  onChange: (players: Player[]) => void;
  teamColor: string;
}> = ({ title, players, onChange }) => {
  const handlePlayerChange = (id: string, field: 'name' | 'number', value: any) => {
    const updated = players.map(p => {
      if (p.id === id) {
        if (field === 'number') {
          return { ...p, number: parseInt(value) || 0 };
        }
        return { ...p, name: value };
      }
      return p;
    });
    onChange(updated);
  };

  const addPlayer = () => {
    const nextNumber = players.length > 0 ? Math.max(...players.map(p => p.number)) + 1 : 1;
    onChange([
      ...players,
      {
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Jugador ${nextNumber}`,
        number: nextNumber
      }
    ]);
  };

  const removePlayer = (id: string) => {
    onChange(players.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-inner mt-4">
      <h4 className="font-black text-xs text-white uppercase tracking-widest mb-4 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[10px] text-white/50">{players.length} Jugadores</span>
      </h4>

      <div className="max-h-60 overflow-y-auto pr-1 no-scrollbar space-y-2 mb-4">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <input
              type="number"
              value={p.number || ''}
              onChange={(e) => handlePlayerChange(p.id, 'number', e.target.value)}
              className="w-12 bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-black text-center text-white focus:border-[#c6ff00] outline-none"
              placeholder="#"
            />
            <input
              type="text"
              value={p.name}
              onChange={(e) => handlePlayerChange(p.id, 'name', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold text-white focus:border-[#c6ff00] outline-none uppercase"
              placeholder="Nombre Jugador"
            />
            <button
              type="button"
              onClick={() => removePlayer(p.id)}
              className="text-red-400 hover:text-red-500 hover:bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPlayer}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:border-[#c6ff00] cursor-pointer"
      >
        + Añadir Jugador
      </button>
    </div>
  );
};

interface TeamStepProps {
  isLocal: boolean;
  teamName: string;
  setTeamName: (name: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  role: UserRole;
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

export const TeamStep: React.FC<TeamStepProps> = ({
  isLocal,
  teamName,
  setTeamName,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  role,
  players,
  setPlayers
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-[#0d121f]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Encabezado del Paso */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm shadow-md ${
              isLocal ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <i className={`fa-solid ${isLocal ? 'fa-house' : 'fa-bus'}`}></i>
          </div>
          <div>
            <h3 className="font-black text-base text-white uppercase tracking-wider font-sans">
              {isLocal ? 'Configuración del Equipo Local' : 'Configuración del Equipo Visitante'}
            </h3>
            <p className="text-xs text-white/50">
              Personaliza el nombre, los colores del uniforme y la indumentaria
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
              Nombre Oficial del Equipo
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-sm font-black text-white focus:border-[#c6ff00] outline-none shadow-inner uppercase tracking-wider transition-colors"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder={isLocal ? 'CLUB LOCAL' : 'CLUB VISITANTE'}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorDropdown
              label="Color Primario (Camiseta)"
              selected={primaryColor}
              onSelect={setPrimaryColor}
            />
            <ColorDropdown
              label="Color Secundario (Detalles / Números)"
              selected={secondaryColor}
              onSelect={setSecondaryColor}
            />
          </div>

          <TeamPreview
            name={teamName}
            primary={primaryColor}
            secondary={secondaryColor}
          />

          {role === UserRole.PRESS && (
            <PlayerListEditor
              title={isLocal ? 'Plantel Local (Prensa)' : 'Plantel Visitante (Prensa)'}
              players={players}
              onChange={setPlayers}
              teamColor={primaryColor}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamStep;
