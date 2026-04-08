
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppState, UserRole, Game, TacticalScheme } from './types';
import { PersistenceManager } from './services/PersistenceManager';

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

  const handleLogin = (user: { id: string, uid: string, email: string, role: UserRole, name: string, avatar?: string }) => {
    const newState = {
      ...state,
      currentUser: user
    };
    setState(newState);
    
    // Hydrate data from cloud upon successful login
    PersistenceManager.hydrateFromCloud(user.uid);

    navigate('/dashboard');
  };

  const handleLogout = () => {
    PersistenceManager.clearLocalData();
    // Also clear the active game resume data specifically
    localStorage.removeItem('sportsnote_current_game');
    setState({ ...state, currentUser: null, activeGameId: null, matches: [], tacticalSchemes: [], players: [] });
    navigate('/');
  };

  const createGame = (game: Game) => {
    const newGame = {
      ...game,
      userId: state.currentUser?.uid, // Used for legacy sync
      ownerId: state.currentUser?.uid // Used for tactics and ownership
    };
    
    // Ensure it is saved locally AND queued for sync immediately
    PersistenceManager.createGame(newGame);

    const newState = {
      ...state,
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
    <div className="min-h-screen flex flex-col font-lato">
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
              : <NewGameView role={state.currentUser.role} onCreate={createGame} />
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