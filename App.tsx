
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppState, UserRole, Game } from './types';
import { dbService } from './services/dbService';

// Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import NewGameView from './views/NewGameView';
import LiveGameView from './views/LiveGameView';
import SummaryView from './views/SummaryView';
import MatchHistory from './views/MatchHistory';
import GlobalStatsDashboard from './views/GlobalStatsDashboard';

const AppContent: React.FC = () => {
  const [state, setState] = useState<AppState>(dbService.loadState());
  const navigate = useNavigate();
  const location = useLocation();

  // Guardar estado automáticamente en cada cambio
  useEffect(() => {
    dbService.saveState(state);
  }, [state]);

  // Lógica de recuperación automática al iniciar
  useEffect(() => {
    const isRoot = location.pathname === '/';
    if (isRoot && state.activeGameId) {
      // Si hay un juego activo, redirigir directamente a la vista de juego
      navigate(`/live/${state.activeGameId}`, { replace: true });
    }
  }, []);

  const handleLogin = (role: UserRole) => {
    const newState = {
      ...state,
      currentUser: { id: 'local_user', name: 'Usuario Principal', role }
    };
    setState(newState);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setState({ ...state, currentUser: null, activeGameId: null });
    navigate('/');
  };

  const createGame = (game: Game) => {
    const newState = {
      ...state,
      matches: [...state.matches, game],
      activeGameId: game.id
    };
    setState(newState);
    navigate(`/live/${game.id}`);
  };

  const closeActiveGame = () => {
    setState({ ...state, activeGameId: null });
  };

  const handleAnnulGame = () => {
    setState(prevState => ({
      ...prevState,
      matches: prevState.matches.filter(m => m.id !== prevState.activeGameId),
      activeGameId: null
    }));
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
              : <DashboardView user={state.currentUser} matches={state.matches} onLogout={handleLogout} />
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
              onExitGame={closeActiveGame}
              onAnnulGame={handleAnnulGame}
            />
            : <Navigate to="/" />
        } />

        <Route path="/summary/:id" element={
          state.currentUser ? <SummaryView /> : <Navigate to="/" />
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