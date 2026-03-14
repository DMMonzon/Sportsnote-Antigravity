
import React from 'react';

interface GameFieldProps {
  onSelectCoord?: (x: number, y: number) => void;
  events?: { x: number, y: number, type: string }[];
  activeCoord?: { x: number, y: number } | null;
}

export const GameField: React.FC<GameFieldProps> = ({
  onSelectCoord,
  events = [],
  activeCoord = null
}) => {

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelectCoord) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onSelectCoord(x, y);
  };

  return (
    <div
      className="relative w-full aspect-[2/3] md:aspect-[3/4] bg-emerald-700 border-4 border-white/60 rounded-[40px] overflow-hidden cursor-crosshair shadow-2xl"
      onClick={handleClick}
    >
      {/* Textura de césped */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]"></div>

      {/* Línea Central */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/40 rounded-full" />

      {/* Líneas de 23 Metros (Punteadas) - Posición reglamentaria 23% */}
      <div className="absolute top-[23%] left-0 right-0 h-px border-t-2 border-dashed border-white/30" />
      <div className="absolute bottom-[23%] left-0 right-0 h-px border-t-2 border-dashed border-white/30" />

      {/* Áreas de Tiro (D) - Radio 16% de la longitud total garantiza que NO toque la línea de 23% */}
      {/* Proporción: Ancho 53% / Alto 32% para mantener circularidad real en el canvas CSS */}
      {/* Superior */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 border-4 border-white/20 rounded-full -translate-y-1/2"
        style={{ width: '53%', height: '32%' }}
      />
      {/* Inferior */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 border-4 border-white/20 rounded-full translate-y-1/2"
        style={{ width: '53%', height: '32%' }}
      />

      {/* Puntos de Penal */}
      <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
      <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />

      {/* Arcos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-4 border-b-2 border-x-2 border-white/50 rounded-b-lg bg-black/10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-4 border-t-2 border-x-2 border-white/50 rounded-t-lg bg-black/10" />



      {/* Marcador de Selección Activa */}
      {activeCoord && (
        <div
          className="absolute w-8 h-8 border-4 border-secondary rounded-full animate-pulse shadow-lg z-50"
          style={{ left: `${activeCoord.x}%`, top: `${activeCoord.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      )}
    </div>
  );
};
