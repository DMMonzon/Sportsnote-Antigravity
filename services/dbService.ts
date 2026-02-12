
import { Game, AppState, UserRole } from '../types';

const STORAGE_KEY = 'sportsnote_db';

export const dbService = {
  saveState: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  
  loadState: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        currentUser: null,
        games: [],
        activeGameId: null
      };
    }
    return JSON.parse(data);
  },

  createGame: (game: Game) => {
    const state = dbService.loadState();
    state.games.push(game);
    dbService.saveState(state);
  },

  updateGame: (game: Game) => {
    const state = dbService.loadState();
    const index = state.games.findIndex(g => g.id === game.id);
    if (index !== -1) {
      state.games[index] = game;
      dbService.saveState(state);
    }
  },

  getGame: (id: string): Game | undefined => {
    const state = dbService.loadState();
    return state.games.find(g => g.id === id);
  }
};
