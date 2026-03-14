import { Game, Possession } from '../types';

const ACTIVE_GAME_KEY = 'sportsnote_current_game';

export interface ActiveGameState {
  game: Game;
  seconds: number;
  period: number;
  possession: Possession;
  localPossessionTime: number;
  awayPossessionTime: number;
  passCount: number;
  isRunning: boolean;
}

export const StorageService = {
  saveActiveGame: (state: ActiveGameState) => {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(state));
  },

  getActiveGame: (): ActiveGameState | null => {
    const data = localStorage.getItem(ACTIVE_GAME_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as ActiveGameState;
    } catch (e) {
      console.error("Error parsing active game from local storage", e);
      return null;
    }
  },

  clearActiveGame: () => {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  }
};
