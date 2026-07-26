import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Game, Player } from '../types';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { useNavigate, useLocation } from 'react-router-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';
import { db, collection, doc, auth } from '../services/firebase';
import { PersistenceManager } from '../services/PersistenceManager';
import dbAccionesJson from '../acciones_de_deportes.json';

interface NewGameViewProps {
  user: {
    id: string;
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    avatar?: string;
    plan?: 'free' | 'premium' | 'admin';
    cycleStartDate?: number;
    matchesCreatedInCycle?: number;
  };
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
  const selectedColor = COLOR_OPTIONS.find(c => c.hex.toLowerCase() === selected.toLowerCase()) || COLOR_OPTIONS[0];

  return (
    <div className="flex flex-col w-full relative" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">{label}</label>
      <button
        type="button"
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
              type="button"
              key={c.hex}
              onMouseDown={() => { onSelect(c.hex); setIsOpen(false); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/10 last:border-0 text-left"
            >
              <div className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }}></div>
              <span className={`text-xs ${selected.toLowerCase() === c.hex.toLowerCase() ? 'font-black text-[#00fe00]' : 'font-medium text-white/85'}`}>{c.name}</span>
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

const PlayerListEditor: React.FC<{
  title: string,
  players: Player[],
  onChange: (players: Player[]) => void,
  teamColor: string
}> = ({ title, players, onChange, teamColor }) => {
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
    onChange([...players, { id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: `Jugador ${nextNumber}`, number: nextNumber }]);
  };

  const removePlayer = (id: string) => {
    onChange(players.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-inner animate-in fade-in duration-300">
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
              className="w-12 bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-black text-center text-white focus:border-[#00fe00] outline-none"
              placeholder="#"
            />
            <input
              type="text"
              value={p.name}
              onChange={(e) => handlePlayerChange(p.id, 'name', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold text-white focus:border-[#00fe00] outline-none uppercase font-lato"
              placeholder="Nombre Jugador"
            />
            <button
              type="button"
              onClick={() => removePlayer(p.id)}
              className="text-red-400 hover:text-red-500 hover:bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
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
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:border-[#00fe00]"
      >
        + Añadir Jugador
      </button>
    </div>
  );
};

const NewGameView: React.FC<NewGameViewProps> = ({ user, onCreate }) => {
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white font-lato">
        <div className="text-center">
          <p className="text-sm opacity-60 uppercase tracking-widest mb-4">Cargando perfil de usuario...</p>
          <div className="w-8 h-8 border-2 border-[#00fe00] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const role = user.role;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkingQuota, setCheckingQuota] = useState(false);

  const checkQuotaAndProceed = async (proceedCallback: () => void) => {
    const plan = user.plan || 'free';
    if (plan === 'premium' || plan === 'admin') {
      proceedCallback();
      return;
    }

    setCheckingQuota(true);
    try {
      const profile = await PersistenceManager.getUserProfile(user.email);
      const checked = await PersistenceManager.checkAndResetUserCycle(user.email, profile);
      
      setCheckingQuota(false);
      if (checked.matchesCreatedInCycle >= 4) {
        setShowPaywall(true);
      } else {
        proceedCallback();
      }
    } catch (e) {
      setCheckingQuota(false);
      if ((user.matchesCreatedInCycle || 0) >= 4) {
        setShowPaywall(true);
      } else {
        proceedCallback();
      }
    }
  };

  const template = location.state?.template as Game | undefined;
  const [selectedSportId, setSelectedSportId] = useState<string>(location.state?.sportId || template?.sportId || 'hockey_cesped');

  const queryParams = new URLSearchParams(location.search);
  const isScheduleMode = queryParams.get('mode') === 'schedule';

  const [fecha, setFecha] = useState<string>(
    template?.createdAt 
      ? new Date(template.createdAt).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );

  const sports = [
    { id: 'hockey_cesped', name: 'Hockey', bg: 'https://images.unsplash.com/photo-1734159319354-b9ead78dd441?q=80&w=1000', icon: 'fa-solid fa-hockey-puck', subtitle: 'FIH Oficial • Registro Neutral' },
    { id: 'futbol', name: 'Fútbol', bg: 'https://images.unsplash.com/photo-1686121177669-0ab65867ab84?q=80&w=1000', icon: 'fa-solid fa-futbol', subtitle: 'FIFA Oficial • Registro Neutral' },
    { id: 'voley', name: 'Vóley', bg: 'https://images.unsplash.com/photo-1666901356149-93f2eb3ba5a2?q=80&w=1000', icon: 'fa-solid fa-volleyball', subtitle: 'FIVB Oficial • Registro Neutral' },
    { id: 'basket', name: 'Básquet', bg: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000', icon: 'fa-solid fa-basketball', subtitle: 'FIBA Oficial • Registro Neutral' }
  ];

  const handleSportSelect = (sportId: string) => {
    setSelectedSportId(sportId);
  };

  const currentIndex = sports.findIndex(s => s.id === selectedSportId) !== -1 
    ? sports.findIndex(s => s.id === selectedSportId) 
    : 0;

  const leftIndex = (currentIndex - 1 + sports.length) % sports.length;
  const rightIndex = (currentIndex + 1) % sports.length;

  const visibleSports = [
    { ...sports[leftIndex], slot: 'left' },
    { ...sports[currentIndex], slot: 'center' },
    { ...sports[rightIndex], slot: 'right' }
  ];

  const currentSport = sports.find(s => s.id === selectedSportId) || sports[0];
  const sportConfig = dbAccionesJson.find(s => s.id === selectedSportId) || dbAccionesJson[0];
  const reglamento = sportConfig.reglamento;

  const [duracionPeriodo, setDuracionPeriodo] = useState<number>(reglamento.duracion_periodo_minutos || 15);
  const [cantidadPeriodos, setCantidadPeriodos] = useState<number>(reglamento.cantidad_periodos || 4);
  const [maxSets, setMaxSets] = useState<number>(template?.metadata?.maxSets || 3);

  // Sincronizar de forma reactiva los parámetros según el reglamento del deporte elegido
  useEffect(() => {
    const sport = dbAccionesJson.find(s => s.id === selectedSportId);
    if (sport) {
      if (sport.reglamento.por_tiempo) {
        setDuracionPeriodo(sport.reglamento.duracion_periodo_minutos || 15);
        setCantidadPeriodos(sport.reglamento.cantidad_periodos || 4);
      } else {
        setDuracionPeriodo(15);
        setCantidadPeriodos(4);
      }
      if (sport.reglamento.modo_puntuacion === 'sets') {
        setMaxSets(template?.metadata?.maxSets || 3);
      }
    }
  }, [selectedSportId]);

  const [teamHome, setTeamHome] = useState(template?.teamHome.name || 'LOCAL');
  const [teamHomePrimary, setTeamHomePrimary] = useState(template?.teamHome.primaryColor || '#0000FF');
  const [teamHomeSecondary, setTeamHomeSecondary] = useState(template?.teamHome.secondaryColor || '#FFFFFF');

  const [teamAway, setTeamAway] = useState(template?.teamAway.name || 'VISITANTE');
  const [teamAwayPrimary, setTeamAwayPrimary] = useState(template?.teamAway.primaryColor || '#FF0000');
  const [teamAwaySecondary, setTeamAwaySecondary] = useState(template?.teamAway.secondaryColor || '#FFFFFF');

  const [registroMode, setRegistroMode] = useState<'visual' | 'botones'>(
    user.role === UserRole.COACH ? 'visual' : 'botones'
  );

  // Metadata para Periodistas (Prensa)
  const [torneo, setTorneo] = useState(template?.metadata?.torneo || '');
  const [jornada, setJornada] = useState(template?.metadata?.jornada || '');
  const [rama, setRama] = useState(template?.metadata?.rama || 'Femenino');
  const [categoria, setCategoria] = useState(template?.metadata?.categoria || '');
  const [estadio, setEstadio] = useState(template?.metadata?.estadio || '');
  const [hora, setHora] = useState(template?.metadata?.hora || '');
  const [arbitros, setArbitros] = useState(template?.metadata?.arbitros || '');

  // Listas de buena fe (Prensa)
  const defaultLocalPlayers = template?.metadata?.localPlayers || Array.from({ length: 15 }, (_, i) => ({
    id: `lh_${i + 1}`,
    name: `Jugador ${i + 1}`,
    number: i + 1
  }));
  const defaultAwayPlayers = template?.metadata?.visitantePlayers || Array.from({ length: 15 }, (_, i) => ({
    id: `la_${i + 1}`,
    name: `Rival ${i + 1}`,
    number: i + 1
  }));

  const [localPlayers, setLocalPlayers] = useState<Player[]>(defaultLocalPlayers);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>(defaultAwayPlayers);

  const handleStartGame = () => {
    checkQuotaAndProceed(() => {
      const newGameId = doc(collection(db, 'matches')).id;
      
      let sportType = SportType.GOAL_BASED;
      if (selectedSportId === 'hockey_cesped') sportType = SportType.HOCKEY;
      else if (selectedSportId === 'voley' || selectedSportId === 'basket') sportType = SportType.POINT_BASED;

      const defaultLocalPlayersList = role === UserRole.PRESS ? localPlayers : Array.from({ length: reglamento?.jugadores_titulares || 11 }, (_, i) => ({
        id: `lh_${i + 1}`,
        name: `Jugador ${i + 1}`,
        number: i + 1
      }));

      const defaultAwayPlayersList = role === UserRole.PRESS ? awayPlayers : Array.from({ length: reglamento?.jugadores_titulares || 11 }, (_, i) => ({
        id: `la_${i + 1}`,
        name: `Rival ${i + 1}`,
        number: i + 1
      }));

      const newGame: Game = {
        id: newGameId,
        sportType,
        sportId: selectedSportId,
        authorId: auth.currentUser?.uid || PersistenceManager.loadStateLocal().currentUser?.uid || '',
        registroMode: role === UserRole.COACH ? registroMode : 'botones',
        teamHome: {
          id: 'th_' + Date.now(),
          name: teamHome.toUpperCase(),
          primaryColor: teamHomePrimary,
          secondaryColor: teamHomeSecondary,
          players: defaultLocalPlayersList
        },
        teamAway: {
          id: 'ta_' + Date.now(),
          name: teamAway.toUpperCase(),
          primaryColor: teamAwayPrimary,
          secondaryColor: teamAwaySecondary,
          players: defaultAwayPlayersList
        },
        scoreHome: 0,
        scoreAway: 0,
        events: [],
        isLive: !isScheduleMode,
        duration: 0,
        role,
        createdAt: (isScheduleMode && fecha) ? (new Date(`${fecha}T${hora || '00:00'}`).getTime() || Date.now()) : Date.now(),
        passChains: [],
        isCounted: false,
        status: isScheduleMode ? 'scheduled' : 'active',
        metadata: {
          torneo: torneo || 'Partido Único',
          jornada: jornada || 'Fecha 1',
          rama: rama || 'Femenino',
          categoria: categoria || 'General',
          estadio: estadio || 'Estadio Local',
          hora: hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arbitros: arbitros || 'Juez Principal',
          localPlayers: defaultLocalPlayersList,
          visitantePlayers: defaultAwayPlayersList,
          localStarters: [],
          visitanteStarters: [],
          maxSets: reglamento?.modo_puntuacion === 'sets' ? maxSets : 3,
          duracionPeriodo: reglamento?.por_tiempo ? duracionPeriodo : undefined,
          cantidadPeriodos: reglamento?.por_tiempo ? cantidadPeriodos : undefined,
          setPointsHome: 0,
          setPointsAway: 0,
          setsWonHome: 0,
          setsWonAway: 0,
          setsHistory: []
        },
        stats: {
          local: { gol: 0, faltas_cometidas: 0, perdidas: 0, recuperos: 0 },
          visitante: { gol: 0, faltas_cometidas: 0, perdidas: 0, recuperos: 0 }
        }
      };

      onCreate(newGame);
      telemetryService.logEvent(TelemetryEvent.START_GAME, {
        gameId: newGame.id,
        teams: `${newGame.teamHome.name} vs ${newGame.teamAway.name}`,
        role
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 overflow-y-auto relative z-10 w-full font-lato">
      <header className="mb-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Preparar Partido' }]} />
        <div className="hidden sm:block mb-6">
          <span className="text-[10px] font-black text-white/50 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Modo: {role === UserRole.PRESS ? 'Periodista (Prensa)' : role}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full pb-20">
        <div className="w-full mb-2 animate-stagger h-[180px] flex flex-col justify-center" style={{ animationDelay: '50ms' }}>
          <p className="text-[#b4b4b4] text-[10px] font-black tracking-[3px] uppercase mb-3 text-center">Selecciona Deporte</p>
          <div className="flex gap-6 justify-center items-center w-full h-full overflow-visible">
            {visibleSports.map((s) => {
              const isSelected = s.slot === 'center';
              return (
                <button
                  id={`sport-card-${s.id}`}
                  key={s.id}
                  type="button"
                  onClick={() => handleSportSelect(s.id)}
                  className={`shrink-0 w-64 h-36 rounded-[28px] relative overflow-hidden border transition-all duration-300 ease-out cursor-pointer bg-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 ${
                    isSelected 
                      ? 'scale-105 border-[#00fe00] shadow-[0_0_30px_rgba(0,254,0,0.35)] z-10 opacity-100' 
                      : 'scale-90 border-white/5 opacity-40 hover:opacity-60 z-0'
                  }`}
                >
                  {s.bg && (
                    <img 
                      src={s.bg} 
                      alt={s.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10"></div>
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-between items-start text-left">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border transition-colors duration-300 ${
                      isSelected ? 'bg-[#00fe00]/20 border-[#00fe00]/50 text-[#00fe00]' : 'bg-white/5 border-white/10 text-white/70'
                    }`}>
                      <i className={s.icon}></i>
                    </div>
                    <div>
                      <h4 className="font-contrail text-2xl text-white italic tracking-wider leading-none uppercase drop-shadow">
                        {s.name}
                      </h4>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-1">
                        {isSelected ? 'Seleccionado' : 'Elegir'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {reglamento && (
          <GlassCard className="p-6 relative z-30 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Configuración del Reglamento</h3>
            </div>

            {reglamento.por_tiempo === true && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl animate-in fade-in duration-300">
                <div>
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                    Duración del Período (Minutos)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                    value={duracionPeriodo}
                    onChange={(e) => setDuracionPeriodo(Math.max(1, parseInt(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">
                    Cantidad de Tiempos / Períodos
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                    value={cantidadPeriodos}
                    onChange={(e) => setCantidadPeriodos(Math.max(1, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>
            )}

            {reglamento.modo_puntuacion === 'sets' && (
              <div className="animate-in fade-in duration-300">
                <p className="text-[10px] text-white/50 font-bold mb-4 uppercase">
                  Selecciona la cantidad de sets a disputar
                </p>
                <div className="flex gap-4 max-w-md">
                  <button
                    type="button"
                    onClick={() => setMaxSets(3)}
                    className={`flex-1 p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                      maxSets === 3
                        ? 'bg-[#00fe00]/20 border-[#00fe00] text-white font-black shadow-lg shadow-[#00fe00]/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black font-contrail">AL MEJOR DE 3 SETS</span>
                    <span className="text-[9px] opacity-60 normal-case font-medium">Gana el primero en obtener 2 sets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaxSets(5)}
                    className={`flex-1 p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                      maxSets === 5
                        ? 'bg-[#00fe00]/20 border-[#00fe00] text-white font-black shadow-lg shadow-[#00fe00]/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black font-contrail">AL MEJOR DE 5 SETS</span>
                    <span className="text-[9px] opacity-60 normal-case font-medium">Gana el primero en obtener 3 sets</span>
                  </button>
                </div>
              </div>
            )}

            {reglamento.por_tiempo === false && reglamento.modo_puntuacion !== 'sets' && (
              <p className="text-xs text-white/50 italic animate-in fade-in duration-300">
                Este deporte no utiliza cronómetro configurable. Inicio directo habilitado.
              </p>
            )}
          </GlassCard>
        )}

        <GlassCard className="p-6 lg:p-8 relative z-30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm"><i className="fa-solid fa-circle-info"></i></div>
            <h3 className="font-black text-sm text-white uppercase tracking-widest">Información del Encuentro</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Torneo</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={torneo}
                onChange={e => setTorneo(e.target.value)}
                placeholder="Ej: Metropolitano A"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Jornada</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={jornada}
                onChange={e => setJornada(e.target.value)}
                placeholder="Ej: Fecha 4"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Rama</label>
              <select
                className="w-full bg-[#131041] border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={rama}
                onChange={e => setRama(e.target.value)}
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Categoría</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                placeholder="Ej: Primera Division"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Estadio</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={estadio}
                onChange={e => setEstadio(e.target.value)}
                placeholder="Ej: Club Harrods"
              />
            </div>
            {isScheduleMode && (
              <>
                <div>
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Fecha del Partido</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner [color-scheme:dark]"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Hora</label>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Árbitros / Jueces</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white focus:border-[#00fe00] outline-none shadow-inner"
                value={arbitros}
                onChange={e => setArbitros(e.target.value)}
                placeholder="Ej: L. Gómez, M. Rodríguez"
              />
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6 flex flex-col gap-6 relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm"><i className="fa-solid fa-house"></i></div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Equipo Local</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Nombre del Equipo</label>
                <input
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-[#00fe00] outline-none shadow-inner uppercase"
                  value={teamHome}
                  onChange={e => setTeamHome(e.target.value)}
                  placeholder="CLUB LOCAL"
                />
              </div>
              <div className="flex gap-4">
                <ColorDropdown label="Primario" selected={teamHomePrimary} onSelect={setTeamHomePrimary} />
                <ColorDropdown label="Secundario" selected={teamHomeSecondary} onSelect={setTeamHomeSecondary} />
              </div>
              <TeamPreview name={teamHome} primary={teamHomePrimary} secondary={teamHomeSecondary} />
              
              {role === UserRole.PRESS && (
                <PlayerListEditor title="Plantel Local" players={localPlayers} onChange={setLocalPlayers} teamColor={teamHomePrimary} />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm"><i className="fa-solid fa-bus"></i></div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Equipo Visitante</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 block">Nombre del Equipo</label>
                <input
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-[#00fe00] outline-none shadow-inner uppercase"
                  value={teamAway}
                  onChange={e => setTeamAway(e.target.value)}
                  placeholder="CLUB VISITANTE"
                />
              </div>
              <div className="flex gap-4">
                <ColorDropdown label="Primario" selected={teamAwayPrimary} onSelect={setTeamAwayPrimary} />
                <ColorDropdown label="Secundario" selected={teamAwaySecondary} onSelect={setTeamAwaySecondary} />
              </div>
              <TeamPreview name={teamAway} primary={teamAwayPrimary} secondary={teamAwaySecondary} />
              
              {role === UserRole.PRESS && (
                <PlayerListEditor title="Plantel Visitante" players={awayPlayers} onChange={setAwayPlayers} teamColor={teamAwayPrimary} />
              )}
            </div>
          </GlassCard>
        </div>

        {role === UserRole.COACH && (
          <GlassCard className="p-6 lg:p-8 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] text-sm"><i className="fa-solid fa-sliders"></i></div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest font-contrail">Modalidad de Registro</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
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
                type="button"
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
        )}

        {role === UserRole.PRESS && (
          <div className="w-full flex justify-center mt-2">
            <button
              disabled
              type="button"
              className="bg-white/5 border border-white/10 text-white/40 cursor-not-allowed px-6 py-4 rounded-2xl flex items-center justify-center gap-3 w-full max-w-md font-bold text-[10px] uppercase tracking-wider relative overflow-hidden"
            >
              <i className="fa-solid fa-file-excel text-lg text-white/40"></i>
              <span>Cargar Plantel desde Excel/CSV</span>
              <span className="bg-[#00fe00]/20 text-[#00fe00] border border-[#00fe00]/40 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-inner">
                Premium
              </span>
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="bg-[#b4b4b4] text-black px-8 py-5 font-bold text-[11px] uppercase tracking-[2px] hover:bg-[#c0c0c0] transition-all active:scale-95 flex items-center justify-center gap-3 w-full lg:max-w-md shadow-[0_0_20px_rgba(180,180,180,0.2)] font-contrail disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartGame}
            disabled={checkingQuota}
          >
            {checkingQuota ? (
              'VERIFICANDO CUOTA...'
            ) : isScheduleMode ? (
              <>PROGRAMAR JUEGO <i className="fa-solid fa-calendar-check"></i></>
            ) : (
              <>COMENZAR JUEGO <i className="fa-solid fa-arrow-right"></i></>
            )}
          </button>
        </div>
      </div>

      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#131041]/95 border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center text-yellow-500 text-4xl mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">
              <i className="fa-solid fa-crown"></i>
            </div>
            <h3 className="font-contrail text-2xl text-white tracking-wide mb-4 uppercase italic text-center leading-tight">
              ¡Alcanzaste tu límite de partidos por ciclo!
            </h3>
            <p className="text-[13px] text-white/75 font-lato mb-8 leading-relaxed max-w-sm">
              Has registrado los 4 partidos correspondientes a tu ciclo de 30 días. Pásate al Plan Pro para cobertura ilimitada de partidos en todos los deportes, exportación de reportes y estadísticas avanzadas.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                type="button"
                onClick={() => {
                  alert("¡Gracias por tu interés! Esta funcionalidad de pago se implementará próximamente.");
                }} 
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black py-4 rounded-2xl active:scale-95 text-[11px] uppercase tracking-widest shadow-[0_4px_20px_rgba(234,179,8,0.3)] hover:brightness-110 transition-all"
              >
                Obtener Plan Premium
              </button>
              <button 
                type="button"
                onClick={() => setShowPaywall(false)} 
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-colors border border-white/10"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewGameView;
