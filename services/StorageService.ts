import { Game, Possession } from '../types';

const ACTIVE_GAME_KEY = 'active_match';

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
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || !parsed.game) {
        throw new Error("Formato de juego activo inválido o corrupto");
      }
      return parsed as ActiveGameState;
    } catch (e) {
      console.error("Error al recuperar partido activo desde local storage:", e);
      StorageService.clearActiveGame();
      return null;
    }
  },

  clearActiveGame: () => {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  }
};
