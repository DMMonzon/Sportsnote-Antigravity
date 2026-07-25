
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppState, UserRole, Game, TacticalScheme } from './types';
import { PersistenceManager, getTimestampMillis } from './services/PersistenceManager';
import { db } from './services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import NewGameView from './views/NewGameView';
import LiveGameView from './views/LiveGameView';
import SummaryView from './views/SummaryView';
import MatchHistory from './views/MatchHistory';
import GlobalStatsDashboard from './views/GlobalStatsDashboard';
import SquadView from './views/SquadView';


const AppContent: React.FC = () => {
  const [state, setState] = useState<AppState>(PersistenceManager.loadStateLocal());
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUserProfile = async (uid: string) => {
    if (!uid) return;
    try {
      const profile = await PersistenceManager.getUserProfile(uid);
      const checked = await PersistenceManager.checkAndResetUserCycle(uid, profile);
      
      setState(prev => {
        if (!prev.currentUser || prev.currentUser.uid !== uid) return prev;
        
        const updatedUser = {
          ...prev.currentUser,
          plan: checked.plan,
          cycleStartDate: getTimestampMillis(checked.cycleStartDate),
          matchesCreatedInCycle: checked.matchesCreatedInCycle
        };

        if (
          prev.currentUser.plan === updatedUser.plan &&
          prev.currentUser.cycleStartDate === updatedUser.cycleStartDate &&
          prev.currentUser.matchesCreatedInCycle === updatedUser.matchesCreatedInCycle
        ) {
          return prev;
        }

        return {
          ...prev,
          currentUser: updatedUser
        };
      });
    } catch (e) {
      console.error("Error refreshing user profile:", e);
    }
  };

  // Refrescar el perfil del usuario al cambiar o iniciar
  useEffect(() => {
    if (state.currentUser?.uid) {
      refreshUserProfile(state.currentUser.uid);
    }
  }, [state.currentUser?.uid]);

  // Guardar estado automáticamente en cada cambio
  useEffect(() => {
    PersistenceManager.saveStateLocal(state);
  }, [state]);

  // Lógica de recuperación automática al iniciar
  useEffect(() => {
    const isRoot = location.pathname === '/';
    if (isRoot && state.activeGameId) {
      // Si hay un juego activo, redirigir directamente a la vista de juego
      navigate(`/live/${state.activeGameId}`, { replace: true });
    }
  }, []);

  const handleLogin = async (user: { id: string, uid: string, email: string, role: UserRole, name: string, avatar?: string }) => {
    // 1. Recuperar el perfil del usuario desde Firestore
    const profile = await PersistenceManager.getUserProfile(user.uid);
    // 2. Comprobar y resetear ciclo móvil si aplica
    const checked = await PersistenceManager.checkAndResetUserCycle(user.uid, profile);

    const fullUser = {
      ...user,
      plan: checked.plan,
      cycleStartDate: getTimestampMillis(checked.cycleStartDate),
      matchesCreatedInCycle: checked.matchesCreatedInCycle
    };

    const newState = {
      ...state,
      currentUser: fullUser
    };
    setState(newState);
    PersistenceManager.saveStateLocal(newState);
    
    // Hydrate data from cloud upon successful login
    PersistenceManager.hydrateFromCloud(user.uid);

    navigate('/dashboard');
  };

  const handleLogout = () => {
    PersistenceManager.clearLocalData();
    // Also clear the active game resume data specifically
    localStorage.removeItem('active_match');
    setState({ ...state, currentUser: null, activeGameId: null, matches: [], tacticalSchemes: [], players: [] });
    navigate('/');
  };

  const createGame = async (game: Game) => {
    const currentUser = state.currentUser;
    if (!currentUser) return;

    // Verificar si el usuario free superó el límite de partidos
    const plan = currentUser.plan || 'free';
    if (plan === 'free') {
      const profile = await PersistenceManager.getUserProfile(currentUser.uid);
      const checked = await PersistenceManager.checkAndResetUserCycle(currentUser.uid, profile);
      if (checked.matchesCreatedInCycle >= 4) {
        console.warn("Límite de partidos superado. Creación bloqueada.");
        return;
      }
    }

    const newGame = {
      ...game,
      userId: currentUser.uid, // Used for legacy sync
      ownerId: currentUser.uid, // Used for tactics and ownership
      authorId: currentUser.uid // Used for proper Firestore filtering
    };
    
    // Ensure it is saved locally AND queued for sync immediately
    PersistenceManager.createGame(newGame);

    let updatedUser = { ...currentUser };

    if (plan === 'free') {
      const nextCount = (currentUser.matchesCreatedInCycle || 0) + 1;
      updatedUser.matchesCreatedInCycle = nextCount;

      if (navigator.onLine) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            matchesCreatedInCycle: nextCount
          }, { merge: true });
        } catch (e) {
          console.error("Error incrementing matchesCreatedInCycle in Firestore:", e);
        }
      }
    }

    const newState = {
      ...state,
      currentUser: updatedUser,
      matches: [...state.matches, newGame],
      activeGameId: newGame.id
    };
    setState(newState);
    navigate(`/live/${newGame.id}`);
  };

  const closeActiveGame = (finalGame?: Game) => {
    setState(prev => {
      let updatedMatches = prev.matches;
      if (finalGame) {
        updatedMatches = prev.matches.map(m => m.id === finalGame.id ? finalGame : m);
      }
      return {
        ...prev,
        matches: updatedMatches,
        activeGameId: null
      };
    });
  };

  const handleAnnulGame = () => {
    setState(prevState => ({
      ...prevState,
      matches: prevState.matches.filter(m => m.id !== prevState.activeGameId),
      activeGameId: null
    }));
  };

  const handleUpdateTactics = (tactics: TacticalScheme[]) => {
    setState(prevState => ({
      ...prevState,
      tacticalSchemes: tactics
    }));
    PersistenceManager.updateTactics(tactics, state.currentUser?.uid);
  };

  return (
    <div className="min-h-screen flex flex-col font-lato relative overflow-hidden bg-[#020617]">
      {/* Global Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src="./assets/dashboard-bg.jpg" className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0" style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}></div>
      </div>
      
      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col flex-1 h-full w-full">
        <Routes>
        <Route path="/" element={
          state.activeGameId
            ? <Navigate to={`/live/${state.activeGameId}`} replace />
            : (state.currentUser ? <Navigate to="/dashboard" replace /> : <LoginView onLogin={handleLogin} />)
        } />

        <Route path="/dashboard" element={
          state.currentUser ? (
            state.activeGameId
              ? <Navigate to={`/live/${state.activeGameId}`} replace />
              : <DashboardView 
                  user={state.currentUser} 
                  matches={state.matches} 
                  tacticalSchemes={state.tacticalSchemes}
                  onUpdateTactics={handleUpdateTactics}
                  onLogout={handleLogout} 
                />
          ) : <Navigate to="/" />
        } />

        <Route path="/history" element={
          state.currentUser ? (
            state.activeGameId
              ? <Navigate to={`/live/${state.activeGameId}`} replace />
              : <MatchHistory matches={state.matches} onCreateFromTemplate={(g) => navigate('/new-game', { state: { template: g } })} />
          ) : <Navigate to="/" />
        } />

        <Route path="/trends" element={
          state.currentUser ? (
            state.activeGameId
              ? <Navigate to={`/live/${state.activeGameId}`} replace />
              : <GlobalStatsDashboard matches={state.matches} />
          ) : <Navigate to="/" />
        } />

        <Route path="/new-game" element={
          state.currentUser ? (
            state.activeGameId
              ? <Navigate to={`/live/${state.activeGameId}`} replace />
              : <NewGameView user={state.currentUser} onCreate={createGame} />
          ) : <Navigate to="/" />
        } />

        <Route path="/live/:id" element={
          state.currentUser
            ? <LiveGameView
              role={state.currentUser.role}
              tacticalSchemes={state.tacticalSchemes}
              onUpdateTactics={handleUpdateTactics}
              onExitGame={(game) => closeActiveGame(game)}
              onAnnulGame={handleAnnulGame}
            />
            : <Navigate to="/" />
        } />

        <Route path="/summary/:id" element={
          state.currentUser ? <SummaryView allTactics={state.tacticalSchemes} /> : <Navigate to="/" />
        } />

        <Route path="/squad" element={
          state.currentUser ? <SquadView matches={state.matches} /> : <Navigate to="/" />
        } />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;

// Listen for service worker messages to process sync queue
if ('navigator' in window && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PROCESS_SYNC_QUEUE') {
      PersistenceManager.processSyncQueue();
    }
  });

  // Also try to process queue whenever regaining online status
  window.addEventListener('online', () => {
    PersistenceManager.processSyncQueue();
  });
  
  // Custom event when cloud hydration finishes updating local state
  window.addEventListener('local-state-hydrated', () => {
    // A quick way to refresh the state in App if hydrated from cloud while app is running
    // Usually handled by useEffect in a more complex setup, but this forces a page reload 
    // or we can just hope state changes are caught.
    window.location.reload(); 
  });
}