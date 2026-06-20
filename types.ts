
export enum UserRole {
  COACH = 'ENTRENADOR',
  PRESS = 'press',
  ORGANIZER = 'ORGANIZADOR'
}

export enum SportType {
  HOCKEY = 'HOCKEY_FIELD',
  GOAL_BASED = 'GOAL_BASED',
  POINT_BASED = 'POINT_BASED'
}

export enum Possession {
  HOME = 'HOME',
  AWAY = 'AWAY',
  NONE = 'NONE'
}

export interface Player {
  id: string;
  name: string;
  number: number;
  comments?: string;
}


export interface Team {
  id: string;
  name: string;
  players: Player[];
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TacticalScheme {
  id: string;
  name: string;
  description: string;
  objective: string;
  ownerId?: string;
}


export interface GameEvent {
  id: string;
  timestamp: number;
  gameTime: string;
  type: string;
  teamId: string;
  x: number;
  y: number;
  half?: 'own' | 'rival';
  lane?: 'left' | 'center' | 'right';
  details?: string;
  comment?: string;
  passChainCount?: number;
  audioData?: string; // Base64 del audio grabado
  transcription?: string; // Texto transcrito por IA
  isTranscribing?: boolean; // Estado de carga de la transcripción
  scoringTeam?: Possession; // Equipo que anotó (para goles)
  tacticId?: string; // ID de la táctica activa durante el evento
  prevPossession?: Possession; // Posesión antes de este evento (para deshacer)

  // Campos adicionales para el Modo Periodista
  action?: string; // e.g. 'remate_arco_gol'
  player?: string | null; // nombre del jugador
  period?: number;
  team?: 'local' | 'visitante';
  timestampStr?: string; // formato compacto 'MM:SS'
}

export interface MatchMetadata {
  torneo: string;
  jornada: string;
  rama: string;
  categoria: string;
  estadio: string;
  hora: string;
  arbitros: string;
  localPlayers: Player[];
  visitantePlayers: Player[];
  localStarters: string[]; // array de IDs de jugadores titulares
  visitanteStarters: string[]; // array de IDs de jugadores titulares
}

export interface TeamStats {
  gol: number;
  faltas_cometidas: number;
  perdidas: number;
  recuperos: number;
  [key: string]: any;
}

export interface MatchStats {
  local: TeamStats;
  visitante: TeamStats;
}

export interface Game {
  id: string;
  sportType: SportType;
  teamHome: Team;
  teamAway: Team;
  scoreHome: number;
  scoreAway: number;
  events: GameEvent[];
  isLive: boolean;
  duration: number;
  createdAt: number;
  passChains: number[];
  role?: UserRole;
  activeTacticId?: string;
  isFavorite?: boolean;
  ownerId?: string;
  userId?: string;
  authorId?: string;
  registroMode?: 'visual' | 'botones';

  // Campos adicionales para el Modo Periodista
  metadata?: MatchMetadata;
  stats?: MatchStats;
}


export interface AppState {
  currentUser: {
    id: string;
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    avatar?: string;
  } | null;
  matches: Game[];
  activeGameId?: string | null;
  tacticalSchemes: TacticalScheme[];
  players: Player[];
}


