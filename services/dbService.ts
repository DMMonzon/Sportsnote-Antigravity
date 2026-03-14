
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
        matches: [],
        activeGameId: null,
        tacticalSchemes: [],
        players: []
      };


    }
    const state = JSON.parse(data);

    // Migración: si existe 'games' pero no 'matches', renombrar
    if (state.games && !state.matches) {
      state.matches = state.games;
      delete state.games;
    }

    // Asegurar estructura básica si falta algo
    if (!state.matches) state.matches = [];
    if (!state.players) state.players = [];


    return state;
  },

  createGame: (game: Game) => {
    const state = dbService.loadState();
    state.matches.push(game);
    dbService.saveState(state);
  },

  updateGame: (game: Game) => {
    const state = dbService.loadState();
    const index = state.matches.findIndex(g => g.id === game.id);
    if (index !== -1) {
      state.matches[index] = game;
      dbService.saveState(state);
    }
  },

  getGame: (id: string): Game | undefined => {
    const state = dbService.loadState();
    return state.matches.find(g => g.id === id);
  }
};
