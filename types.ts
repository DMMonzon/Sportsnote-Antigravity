

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
  // Added color property used in NewGameView
  color?: string;
  // Fix: Added primaryColor and secondaryColor used in LiveGameView score display
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
  details?: string;
  comment?: string;
  passChainCount?: number;
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
  // Added role property used in SummaryView and NewGameView
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
  // Added activeGameId property used in dbService and App state management
  activeGameId?: string | null;
}