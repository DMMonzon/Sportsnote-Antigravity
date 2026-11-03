import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Game, Player } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { telemetryService, TelemetryEvent } from '../services/telemetryService';
import { db, collection, doc, auth } from '../services/firebase';
import { PersistenceManager } from '../services/PersistenceManager';
import dbAccionesJson from '../acciones_de_deportes.json';

import {
  SPORTS_CATALOG,
  SportJsonItem,
  PregameStepper,
  SportCarousel,
  SportParametersPanel,
  PregameFooter,
  GeneralDataStep,
  TeamStep,
  ConfirmationStep
} from '../src/components/pregame';

interface NewGameViewProps {
  user: {
    id: string;
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    avatar?: string;
    plan?: 'free' | 'premium' | 'admin';
    cycleStartDate?: number;
    matchesCreatedInCycle?: number;
  };
  onCreate: (game: Game) => void;
}

const NewGameView: React.FC<NewGameViewProps> = ({ user, onCreate }) => {
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white font-lato">
        <div className="text-center">
          <p className="text-sm opacity-60 uppercase tracking-widest mb-4">Cargando perfil de usuario...</p>
          <div className="w-8 h-8 border-2 border-[#c6ff00] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const role = user.role;
  const navigate = useNavigate();
  const location = useLocation();

  // Control de pasos del Wizard (1 a 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [showPaywall, setShowPaywall] = useState(false);
  const [checkingQuota, setCheckingQuota] = useState(false);

  const checkQuotaAndProceed = async (proceedCallback: () => void) => {
    const plan = user.plan || 'free';
    if (plan === 'premium' || plan === 'admin') {
      proceedCallback();
      return;
    }

    setCheckingQuota(true);
    try {
      const profile = await PersistenceManager.getUserProfile(user.email);
      const checked = await PersistenceManager.checkAndResetUserCycle(user.email, profile);

      setCheckingQuota(false);
      if (checked.matchesCreatedInCycle >= 4) {
        setShowPaywall(true);
      } else {
        proceedCallback();
      }
    } catch (e) {
      setCheckingQuota(false);
      if ((user.matchesCreatedInCycle || 0) >= 4) {
        setShowPaywall(true);
      } else {
        proceedCallback();
      }
    }
  };

  const template = location.state?.template as Game | undefined;
  // Fútbol por defecto para coincidir con la captura de referencia
  const [selectedSportId, setSelectedSportId] = useState<string>(
    location.state?.sportId || template?.sportId || 'futbol'
  );

  const queryParams = new URLSearchParams(location.search);
  const isScheduleMode = queryParams.get('mode') === 'schedule';

  const [fecha, setFecha] = useState<string>(
    template?.createdAt
      ? new Date(template.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  const currentSport: SportJsonItem =
    (dbAccionesJson as SportJsonItem[]).find(s => s.id === selectedSportId) ||
    (dbAccionesJson[1] as SportJsonItem);
  const reglamento = currentSport.reglamento;

  const [duracionPeriodo, setDuracionPeriodo] = useState<number>(
    reglamento.duracion_periodo_minutos || 45
  );
  const [cantidadPeriodos, setCantidadPeriodos] = useState<number>(
    reglamento.cantidad_periodos || 2
  );
  const [maxSets, setMaxSets] = useState<number>(template?.metadata?.maxSets || 3);

  // Sincronizar reactivamente parámetros reglamentarios
  useEffect(() => {
    const s = (dbAccionesJson as SportJsonItem[]).find(item => item.id === selectedSportId);
    if (s) {
      if (s.reglamento.por_tiempo) {
        setDuracionPeriodo(s.reglamento.duracion_periodo_minutos || 45);
        setCantidadPeriodos(s.reglamento.cantidad_periodos || 2);
      } else if (s.reglamento.modo_puntuacion === 'sets') {
        setMaxSets(template?.metadata?.maxSets || 3);
      }
    }
  }, [selectedSportId]);

  const [teamHome, setTeamHome] = useState(template?.teamHome.name || 'LOCAL');
  const [teamHomePrimary, setTeamHomePrimary] = useState(template?.teamHome.primaryColor || '#0000FF');
  const [teamHomeSecondary, setTeamHomeSecondary] = useState(template?.teamHome.secondaryColor || '#FFFFFF');

  const [teamAway, setTeamAway] = useState(template?.teamAway.name || 'VISITANTE');
  const [teamAwayPrimary, setTeamAwayPrimary] = useState(template?.teamAway.primaryColor || '#FF0000');
  const [teamAwaySecondary, setTeamAwaySecondary] = useState(template?.teamAway.secondaryColor || '#FFFFFF');

  const [registroMode, setRegistroMode] = useState<'visual' | 'botones'>(
    user.role === UserRole.COACH ? 'visual' : 'botones'
  );

  // Metadata para Periodistas (Prensa) y Fixture
  const [torneo, setTorneo] = useState(template?.metadata?.torneo || '');
  const [jornada, setJornada] = useState(template?.metadata?.jornada || '');
  const [rama, setRama] = useState(template?.metadata?.rama || 'Femenino');
  const [categoria, setCategoria] = useState(template?.metadata?.categoria || '');
  const [estadio, setEstadio] = useState(template?.metadata?.estadio || '');
  const [hora, setHora] = useState(template?.metadata?.hora || '');
  const [arbitros, setArbitros] = useState(template?.metadata?.arbitros || '');

  // Listas de buena fe (Prensa)
  const defaultLocalPlayers = template?.metadata?.localPlayers || Array.from({ length: 15 }, (_, i) => ({
    id: `lh_${i + 1}`,
    name: `Jugador ${i + 1}`,
    number: i + 1
  }));
  const defaultAwayPlayers = template?.metadata?.visitantePlayers || Array.from({ length: 15 }, (_, i) => ({
    id: `la_${i + 1}`,
    name: `Rival ${i + 1}`,
    number: i + 1
  }));

  const [localPlayers, setLocalPlayers] = useState<Player[]>(defaultLocalPlayers);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>(defaultAwayPlayers);

  // Navegación del Wizard
  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!teamHome.trim()) setTeamHome('LOCAL');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!teamAway.trim()) setTeamAway('VISITANTE');
      setCurrentStep(5);
    } else if (currentStep === 5) {
      handleStartGame();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Creación y confirmación del partido en Firestore / Store
  const handleStartGame = () => {
    checkQuotaAndProceed(() => {
      const newGameId = doc(collection(db, 'matches')).id;

      let sportType = SportType.GOAL_BASED;
      if (selectedSportId === 'hockey_cesped') sportType = SportType.HOCKEY;
      else if (selectedSportId === 'voley' || selectedSportId === 'basket') {
        sportType = SportType.POINT_BASED;
      }

      const defaultLocalPlayersList =
        role === UserRole.PRESS
          ? localPlayers
          : Array.from({ length: currentSport.reglamento.jugadores_titulares || 11 }, (_, i) => ({
              id: `lh_${i + 1}`,
              name: `Jugador ${i + 1}`,
              number: i + 1
            }));

      const defaultAwayPlayersList =
        role === UserRole.PRESS
          ? awayPlayers
          : Array.from({ length: currentSport.reglamento.jugadores_titulares || 11 }, (_, i) => ({
              id: `la_${i + 1}`,
              name: `Rival ${i + 1}`,
              number: i + 1
            }));

      const newGame: Game = {
        id: newGameId,
        sportType,
        sportId: selectedSportId,
        authorId: auth.currentUser?.uid || PersistenceManager.loadStateLocal().currentUser?.uid || '',
        registroMode: role === UserRole.COACH ? registroMode : 'botones',
        teamHome: {
          id: 'th_' + Date.now(),
          name: (teamHome || 'LOCAL').toUpperCase(),
          primaryColor: teamHomePrimary,
          secondaryColor: teamHomeSecondary,
          players: defaultLocalPlayersList
        },
        teamAway: {
          id: 'ta_' + Date.now(),
          name: (teamAway || 'VISITANTE').toUpperCase(),
          primaryColor: teamAwayPrimary,
          secondaryColor: teamAwaySecondary,
          players: defaultAwayPlayersList
        },
        scoreHome: 0,
        scoreAway: 0,
        events: [],
        isLive: !isScheduleMode,
        duration: 0,
        role,
        createdAt:
          isScheduleMode && fecha
            ? new Date(`${fecha}T${hora || '00:00'}`).getTime() || Date.now()
            : Date.now(),
        passChains: [],
        isCounted: false,
        status: isScheduleMode ? 'scheduled' : 'active',
        metadata: {
          torneo: torneo || 'Partido Único',
          jornada: jornada || 'Fecha 1',
          rama: rama || 'Femenino',
          categoria: categoria || 'General',
          estadio: estadio || 'Estadio Local',
          hora: hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arbitros: arbitros || 'Juez Principal',
          localPlayers: defaultLocalPlayersList,
          visitantePlayers: defaultAwayPlayersList,
          localStarters: [],
          visitanteStarters: [],
          maxSets: currentSport.reglamento.modo_puntuacion === 'sets' ? maxSets : 3,
          duracionPeriodo: currentSport.reglamento.por_tiempo ? duracionPeriodo : undefined,
          cantidadPeriodos: currentSport.reglamento.por_tiempo ? cantidadPeriodos : undefined,
          setPointsHome: 0,
          setPointsAway: 0,
          setsWonHome: 0,
          setsWonAway: 0,
          setsHistory: []
        },
        stats: {
          local: { gol: 0, faltas_cometidas: 0, perdidas: 0, recuperos: 0 },
          visitante: { gol: 0, faltas_cometidas: 0, perdidas: 0, recuperos: 0 }
        }
      };

      onCreate(newGame);
      telemetryService.logEvent(TelemetryEvent.START_GAME, {
        gameId: newGame.id,
        teams: `${newGame.teamHome.name} vs ${newGame.teamAway.name}`,
        role
      });
    });
  };

  return (
    <div className="h-screen max-h-[100dvh] flex flex-col overflow-hidden relative z-10 w-full font-lato text-white select-none">
      {/* 1. Encabezado Superior Fijo: Stepper de 5 Pasos (Reemplaza Breadcrumb y Modo) */}
      <header className="w-full shrink-0 pt-4 px-4 sm:px-6 md:px-8 z-20">
        <div className="max-w-5xl mx-auto w-full">
          <PregameStepper
            currentStep={currentStep}
            onStepClick={(stepId) => setCurrentStep(stepId)}
          />
        </div>
      </header>

      {/* 2. Área Central Scrollable (Main con scrolling vertical si el contenido supera el espacio) */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 py-2 w-full no-scrollbar sm:scroll-smooth">
        <div className="max-w-5xl mx-auto w-full flex flex-col items-center pb-6">
          {/* CONTENIDO SEGÚN PASO ACTUAL */}
          {currentStep === 1 && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
              {/* Carrusel Infinito de Deportes con Enfoque Central */}
              <SportCarousel
                selectedSportId={selectedSportId}
                onSelectSport={setSelectedSportId}
              />

              {/* Panel Inferior de Parámetros Reglamentarios Dinámicos */}
              <SportParametersPanel sport={currentSport} />
            </div>
          )}

          {currentStep === 2 && (
            <GeneralDataStep
              sport={currentSport}
              role={role}
              isScheduleMode={isScheduleMode}
              torneo={torneo}
              setTorneo={setTorneo}
              jornada={jornada}
              setJornada={setJornada}
              rama={rama}
              setRama={setRama}
              categoria={categoria}
              setCategoria={setCategoria}
              estadio={estadio}
              setEstadio={setEstadio}
              fecha={fecha}
              setFecha={setFecha}
              hora={hora}
              setHora={setHora}
              arbitros={arbitros}
              setArbitros={setArbitros}
              duracionPeriodo={duracionPeriodo}
              setDuracionPeriodo={setDuracionPeriodo}
              cantidadPeriodos={cantidadPeriodos}
              setCantidadPeriodos={setCantidadPeriodos}
              maxSets={maxSets}
              setMaxSets={setMaxSets}
              registroMode={registroMode}
              setRegistroMode={setRegistroMode}
            />
          )}

          {currentStep === 3 && (
            <TeamStep
              isLocal={true}
              teamName={teamHome}
              setTeamName={setTeamHome}
              primaryColor={teamHomePrimary}
              setPrimaryColor={setTeamHomePrimary}
              secondaryColor={teamHomeSecondary}
              setSecondaryColor={setTeamHomeSecondary}
              role={role}
              players={localPlayers}
              setPlayers={setLocalPlayers}
            />
          )}

          {currentStep === 4 && (
            <TeamStep
              isLocal={false}
              teamName={teamAway}
              setTeamName={setTeamAway}
              primaryColor={teamAwayPrimary}
              setPrimaryColor={setTeamAwayPrimary}
              secondaryColor={teamAwaySecondary}
              setSecondaryColor={setTeamAwaySecondary}
              role={role}
              players={awayPlayers}
              setPlayers={setAwayPlayers}
            />
          )}

          {currentStep === 5 && (
            <ConfirmationStep
              sport={currentSport}
              role={role}
              isScheduleMode={isScheduleMode}
              torneo={torneo}
              jornada={jornada}
              rama={rama}
              categoria={categoria}
              estadio={estadio}
              fecha={fecha}
              hora={hora}
              arbitros={arbitros}
              teamHome={teamHome}
              teamHomePrimary={teamHomePrimary}
              teamHomeSecondary={teamHomeSecondary}
              teamAway={teamAway}
              teamAwayPrimary={teamAwayPrimary}
              teamAwaySecondary={teamAwaySecondary}
              duracionPeriodo={duracionPeriodo}
              cantidadPeriodos={cantidadPeriodos}
              maxSets={maxSets}
              registroMode={registroMode}
            />
          )}
        </div>
      </main>

      {/* 3. Footer Fijo Inferior (Fijo en el inferior sin permitir scrolling vertical global) */}
      <footer className="w-full shrink-0 border-t border-white/10 bg-[#0c0f17]/90 backdrop-blur-md px-4 sm:px-6 md:px-8 py-3 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto w-full">
          <PregameFooter
            currentStep={currentStep}
            onPrev={handlePrev}
            onNext={handleNext}
            onCancel={handleCancel}
            isScheduleMode={isScheduleMode}
            isSubmitting={checkingQuota}
          />
        </div>
      </footer>

      {/* Modal Paywall de Límite de Partidos */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1c1236]/95 border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center text-yellow-500 text-4xl mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">
              <i className="fa-solid fa-crown"></i>
            </div>
            <h3 className="font-sans text-2xl text-white font-black tracking-wide mb-4 uppercase text-center leading-tight">
              ¡Alcanzaste tu límite de partidos por ciclo!
            </h3>
            <p className="text-[13px] text-white/75 font-lato mb-8 leading-relaxed max-w-sm">
              Has registrado los 4 partidos correspondientes a tu ciclo de 30 días. Pásate al Plan Pro para cobertura ilimitada de partidos en todos los deportes, exportación de reportes y estadísticas avanzadas.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                type="button"
                onClick={() => {
                  alert('¡Gracias por tu interés! Esta funcionalidad de pago se implementará próximamente.');
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black py-4 rounded-2xl active:scale-95 text-[11px] uppercase tracking-widest shadow-[0_4px_20px_rgba(234,179,8,0.3)] hover:brightness-110 transition-all cursor-pointer"
              >
                Obtener Plan Premium
              </button>
              <button
                type="button"
                onClick={() => setShowPaywall(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-colors border border-white/10 cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewGameView;
