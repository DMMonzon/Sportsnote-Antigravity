
export enum UserRole {
  COACH = 'ENTRENADOR',
  JOURNALIST = 'PERIODISTA',
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
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
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
}

export interface AppState {
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
    avatar?: string;
  } | null;
  games: Game[];
  activeGameId?: string | null;
}
