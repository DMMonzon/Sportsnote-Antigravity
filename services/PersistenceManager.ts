import { AppState, Game, TacticalScheme } from '../types';
import { db, collection, doc, setDoc, getDocs, query, where, deleteDoc } from './firebase';

const STORAGE_KEY = 'sportsnote_db';
const SYNC_QUEUE_KEY = 'sportsnote_sync_queue';

export interface SyncPayload {
  id: string; // Unique ID for the sync job
  type: 'GAME' | 'TACTIC';
  action: 'UPDATE' | 'CREATE' | 'DELETE';
  data: any;
  timestamp: number;
}

export const PersistenceManager = {
  // --- Local Storage Operations (Primary & Immediate) ---

  saveStateLocal: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  loadStateLocal: (): AppState => {
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

    // Migrations
    if (state.games && !state.matches) {
      state.matches = state.games;
      delete state.games;
    }

    if (!state.matches) state.matches = [];
    if (!state.players) state.players = [];
    if (!state.tacticalSchemes) state.tacticalSchemes = [];

    return state;
  },

  // --- Hybrid Operations (Write Local -> Queue Sync) ---

  createGame: (game: Game) => {
    const state = PersistenceManager.loadStateLocal();
    state.matches.push(game);
    PersistenceManager.saveStateLocal(state);
    
    PersistenceManager.queueForSync({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'GAME',
      action: 'CREATE',
      data: game,
      timestamp: Date.now()
    });
  },

  updateGame: (game: Game) => {
    const state = PersistenceManager.loadStateLocal();
    const index = state.matches.findIndex(g => g.id === game.id);
    if (index !== -1) {
      state.matches[index] = game;
      PersistenceManager.saveStateLocal(state);
      
      PersistenceManager.queueForSync({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'GAME',
        action: 'UPDATE',
        data: game,
        timestamp: Date.now()
      });
    }
  },

  getGame: (id: string): Game | undefined => {
    const state = PersistenceManager.loadStateLocal();
    return state.matches.find(g => g.id === id);
  },

  deleteGame: (gameId: string) => {
    const state = PersistenceManager.loadStateLocal();
    state.matches = state.matches.filter(g => g.id !== gameId);
    PersistenceManager.saveStateLocal(state);
    
    PersistenceManager.queueForSync({
      id: `sync_del_${Date.now()}_${gameId}`,
      type: 'GAME',
      action: 'DELETE',
      data: { id: gameId },
      timestamp: Date.now()
    });
  },

  updateTactics: (tactics: TacticalScheme[], userId?: string) => {
    const state = PersistenceManager.loadStateLocal();
    const tacticsWithOwner = tactics.map(t => ({
      ...t,
      ownerId: t.ownerId || userId // Ensure ownerId is preserved or injected
    }));
    
    state.tacticalSchemes = tacticsWithOwner;
    PersistenceManager.saveStateLocal(state);
    
    tacticsWithOwner.forEach(tactic => {
       PersistenceManager.queueForSync({
        id: `sync_tactic_${Date.now()}_${tactic.id}`,
        type: 'TACTIC',
        action: 'UPDATE',
        data: tactic,
        timestamp: Date.now()
      });
    });
  },

  // --- Synchronization Logic ---

  getSyncQueue: (): SyncPayload[] => {
    const q = localStorage.getItem(SYNC_QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  },

  setSyncQueue: (queue: SyncPayload[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  },

  getSyncQueueLength: (): number => {
    const q = PersistenceManager.getSyncQueue();
    return q.length;
  },

  queueForSync: async (payload: SyncPayload) => {
    const queue = PersistenceManager.getSyncQueue();
    queue.push(payload);
    PersistenceManager.setSyncQueue(queue);

    // Attempt to register background sync via Service Worker
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sportsnote-sync');
        console.log('Background sync registered');
      } catch (err) {
        console.error('Background sync registration failed:', err);
        // Fallback: try to sync immediately if online
        if (navigator.onLine) {
           PersistenceManager.processSyncQueue();
        }
      }
    } else {
      // Fallback for browsers without Background Sync
      if (navigator.onLine) {
         PersistenceManager.processSyncQueue();
      }
    }
  },

  processSyncQueue: async () => {
    const queue = PersistenceManager.getSyncQueue();
    if (queue.length === 0) return;

    if (!navigator.onLine) {
      console.log('Offline, cannot process sync queue.');
      return;
    }

    console.log(`Processing ${queue.length} items from sync queue...`);
    const remainingQueue: SyncPayload[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'GAME') {
            const gameRef = doc(db, 'matches', item.data.id);
            if (item.action === 'DELETE') {
              await deleteDoc(gameRef);
            } else {
              await setDoc(gameRef, item.data, { merge: true });
            }
        } else if (item.type === 'TACTIC') {
            const tacticRef = doc(db, 'tactics', item.data.id);
            await setDoc(tacticRef, item.data, { merge: true });
        }
        console.log(`Successfully synced ${item.type} ${item.data.id}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}`, error);
        // Keep in queue to retry later
        remainingQueue.push(item);
      }
    }

    PersistenceManager.setSyncQueue(remainingQueue);
  },

  // --- End of Game Force Sync ---
  forceSyncGame: async (gameId: string) => {
    const game = PersistenceManager.getGame(gameId);
    if (!game || !navigator.onLine) return; // Cant force sync offline
    
    try {
      // Direct push to Firestore bypassing queue to ensure immediate final save
      const gameRef = doc(db, 'matches', game.id);
      await setDoc(gameRef, game, { merge: true });
      console.log(`Successfully forced sync for final game ${game.id}`);
    } catch (e) {
      console.error("Error forcing sync for game:", e);
      // Fallback to queue if direct fails
      PersistenceManager.queueForSync({
        id: `sync_force_${Date.now()}_${game.id}`,
        type: 'GAME',
        action: 'UPDATE',
        data: game,
        timestamp: Date.now()
      });
    }
  },

  // --- Session Management ---
  clearLocalData: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
    console.log('Local sensitive data cleared.');
  },

  // --- Initial Load Hydration (Firestore -> Local) ---
  hydrateFromCloud: async (userId: string) => {
    if (!navigator.onLine || !userId) return;

    try {
      console.log('Hydrating from cloud...');
      const state = PersistenceManager.loadStateLocal();
      let stateChanged = false;

      // Only pull if current user matches or local is empty (isolation safety)
      if (state.currentUser && state.currentUser.uid !== userId) {
        console.warn('Hydration skipped: Local user mismatch. Clearing local cache first.');
        PersistenceManager.clearLocalData();
        return;
      }

      const matchesRef = collection(db, 'matches');
      // Fetch both new and legacy records
      const qMatches = query(matchesRef, where('userId', '==', userId));
      const qMatchesLegacy = query(matchesRef, where('ownerId', '==', userId));
      
      const [matchesSnap, matchesLegacySnap] = await Promise.all([
        getDocs(qMatches),
        getDocs(qMatchesLegacy)
      ]);

      const cloudMatches: Game[] = [];
      const seenMatchIds = new Set<string>();
      
      const processSnap = (snap: any) => {
        snap.forEach((doc: any) => {
          const data = doc.data() as Game;
          if(!seenMatchIds.has(data.id)) { 
            cloudMatches.push(data); 
            seenMatchIds.add(data.id); 
          }
        });
      };

      processSnap(matchesSnap);
      processSnap(matchesLegacySnap);

      await PersistenceManager.processSyncQueue();
      const finalQueue = PersistenceManager.getSyncQueue();

      if (finalQueue.length === 0) {
        if (cloudMatches.length > 0) {
          // Merge logic: Favor cloud but keep unique local ones (if any)
          const localMatches = state.matches || [];
          const localIds = new Set(localMatches.map(m => m.id));
          
          const mergedMatches = [...cloudMatches];
          localMatches.forEach(lm => {
            if (!seenMatchIds.has(lm.id)) {
              mergedMatches.push(lm);
            }
          });

          state.matches = mergedMatches;
          stateChanged = true;
        }

        // Fetch Tactics
        const tacticsRef = collection(db, 'tactics');
        const qTactics = query(tacticsRef, where('ownerId', '==', userId));
        const tacticsSnap = await getDocs(qTactics);

        const cloudTactics: TacticalScheme[] = [];
        tacticsSnap.forEach(doc => cloudTactics.push(doc.data() as TacticalScheme));

        if (cloudTactics.length > 0) {
          state.tacticalSchemes = cloudTactics;
          stateChanged = true;
        }

        if (stateChanged) {
          PersistenceManager.saveStateLocal(state);
          window.dispatchEvent(new Event('local-state-hydrated'));
        }
      }
    } catch (e) {
      console.error("Error hydrating from cloud:", e);
    }
  }
};
