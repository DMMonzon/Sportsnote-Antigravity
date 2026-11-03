import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { telemetryService } from '../services/telemetryService';
import { auth, googleProvider, signInWithPopup, db, collection, query, where, getDocs, signOut } from '../services/firebase';

interface LoginViewProps {
  onLogin: (user: { id: string; uid: string; email: string; role: UserRole; name: string; avatar?: string }) => void;
}

interface SloganStep {
  title: string;
  description: React.ReactNode;
}

const steps: SloganStep[] = [
  {
    title: 'REGISTRA.',
    description: (
      <span>
        Guarda en tu dispositivo y con unos pocos clicks las{' '}
        <strong className="text-[#c6ff00] font-semibold">acciones clave</strong> de cada juego.
      </span>
    )
  },
  {
    title: 'ANALIZA.',
    description: (
      <span>
        Accede a{' '}
        <strong className="text-[#c6ff00] font-semibold">índices y gráficos automatizados</strong> para tomar las mejores decisiones.
      </span>
    )
  },
  {
    title: 'COMPARTE.',
    description: (
      <span>
        Envía toda la información guardada a tus{' '}
        <strong className="text-[#c6ff00] font-semibold">redes, seguidores o equipo de trabajo</strong>.
      </span>
    )
  }
];

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carrusel dinámico de slogan (rotación cada 3000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error('No email found in Google account.');
      }

      // Check if user is in authorized_users
      const usersRef = collection(db, 'authorized_users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // User not authorized
        await signOut(auth);
        setErrorMsg('Tu email no está autorizado para acceder. Por favor contacta al administrador.');
        setLoading(false);
        return;
      }

      // User authorized, get role from DB
      const userDoc = querySnapshot.docs[0].data();
      const role = (userDoc.role as UserRole) || UserRole.COACH; // Default fallback

      telemetryService.getUUID();

      onLogin({
        id: user.uid,
        uid: user.uid,
        email: user.email,
        role: role,
        name: user.displayName || 'Usuario',
        avatar: user.photoURL || undefined
      });
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const usersRef = collection(db, 'authorized_users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg('Tu email no está autorizado para acceder. Por favor contacta al administrador o ingresa con Google.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0].data();
      const role = (userDoc.role as UserRole) || UserRole.COACH;

      telemetryService.getUUID();

      onLogin({
        id: querySnapshot.docs[0].id || 'email_user',
        uid: querySnapshot.docs[0].id || 'email_user',
        email: cleanEmail,
        role: role,
        name: userDoc.name || cleanEmail.split('@')[0],
        avatar: userDoc.photoURL || undefined
      });
    } catch (err: any) {
      console.error('Email Login Error:', err);
      setErrorMsg('Error al verificar credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    setErrorMsg('El acceso con Apple estará disponible próximamente.');
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#0c0f17] text-white selection:bg-[#c6ff00] selection:text-black relative z-20">
      {/* Columna Izquierda: Hero Editorial */}
      <div className="relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 min-h-[520px] lg:min-h-screen">
        {/* Fondo Deportivo Oscuro */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="./assets/login-bg.jpg"
            alt="Fondo deportivo"
            className="w-full h-full object-cover object-center opacity-35 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f17] via-[#0c0f17]/75 to-[#0c0f17]/90" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(198,255,0,0.05) 0%, transparent 65%)'
            }}
          />
        </div>

        {/* Header Superior: Monograma SN + SPORTSNOTE y Carrusel Pills */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2f1b5e] to-[#16122d] border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <span className="font-black text-sm text-[#c6ff00] tracking-tighter">SN</span>
            </div>
            <span className="text-white font-black text-lg md:text-xl tracking-[0.16em] uppercase font-display">
              SPORTSNOTE
            </span>
          </div>

          {/* Indicador de píldoras del carrusel */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131728]/70 border border-white/10 backdrop-blur-md">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                aria-label={`Paso ${idx + 1}`}
                className={`transition-all duration-500 rounded-full cursor-pointer ${
                  activeStep === idx
                    ? 'w-5 h-1.5 bg-[#c6ff00] shadow-[0_0_8px_#c6ff00]'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bloque Central: Subtítulo Introductorio + Slogans Dinámicos */}
        <div className="relative z-10 my-auto py-10">
          <div className="max-w-xl mb-12">
            <p className="text-white/85 text-base md:text-lg leading-relaxed font-sans">
              Utiliza <strong className="text-white font-bold">SportsNote</strong> y accede a las estadísticas de tu juego al instante.
            </p>
            <p className="text-white/85 text-base md:text-lg leading-relaxed mt-2 font-sans">
              Aprovecha los beneficios de la <strong className="text-white font-bold">Big Data</strong> en tu función de coach, organizador o periodista.
            </p>
          </div>

          {/* Slogans Dinámicos (REGISTRA. ANALIZA. COMPARTE.) */}
          <div className="space-y-4 md:space-y-5">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div key={idx} className="transition-all duration-500 ease-in-out">
                  <button
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`text-left block w-full text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-none select-none transition-all duration-500 ease-in-out font-display cursor-pointer ${
                      isActive
                        ? 'text-[#c6ff00] drop-shadow-[0_0_24px_rgba(198,255,0,0.35)]'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {step.title}
                  </button>

                  {/* Descripción activa con borde vertical izquierdo */}
                  {isActive && (
                    <div className="border-l-2 border-[#c6ff00] pl-4 py-1.5 mt-3 max-w-lg transition-all duration-500 ease-in-out">
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed font-sans">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Espaciador inferior */}
        <div className="relative z-10 hidden lg:block h-6" />
      </div>

      {/* Columna Derecha: Formulario de Acceso y Registro */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-[#0c0f17] border-t lg:border-t-0 lg:border-l border-white/5 relative z-10 min-h-screen">
        {/* Header Superior: SISTEMA CENTRAL / ACCESO y Glow Status */}
        <div className="flex items-center justify-between w-full mb-8 lg:mb-12">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.25em] text-gray-400 uppercase">
            <span>SISTEMA CENTRAL</span>
            <span className="text-white/20">/</span>
            <span className="text-gray-400">ACCESO</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#c6ff00] shadow-[0_0_12px_#c6ff00] animate-pulse" />
        </div>

        {/* Formulario de Login / Registro */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display mb-2">
            {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-sm text-gray-400 font-sans mb-8">
            {isRegisterMode
              ? 'Completa los datos para registrarte en el sistema.'
              : 'Ingresa tus credenciales para acceder a la consola.'}
          </p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm p-3.5 rounded-xl text-center font-medium mb-6">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">
                MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                required
                className="w-full bg-[#131728]/90 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">
                PASS
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#131728]/90 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  <i className={showPassword ? 'fa-regular fa-eye-slash text-sm' : 'fa-regular fa-eye text-sm'} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-gray-100 active:scale-[0.99] text-[#0c0f17] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 mt-6 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Conectando...</span>
                </span>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divisor O CONTINUAR CON */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0c0f17] px-4 text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase whitespace-nowrap">
              O CONTINUAR CON
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Accesos Sociales (Google & Apple) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[#131728]/90 hover:bg-[#1a2035] border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={loading}
              className="w-full bg-[#131728]/90 hover:bg-[#1a2035] border border-white/10 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              <i className="fa-brands fa-apple text-base shrink-0" />
              <span>Apple</span>
            </button>
          </div>

          {/* Toggle Crear Cuenta / Iniciar Sesión */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg(null);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isRegisterMode ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <strong className="text-white font-bold hover:underline">Iniciar Sesión</strong>
                  <i className="fa-solid fa-arrow-right-to-bracket text-[10px] ml-1.5 opacity-70" />
                </>
              ) : (
                <>
                  ¿No eres usuario?{' '}
                  <strong className="text-white font-bold hover:underline">Crear cuenta</strong>
                  <i className="fa-solid fa-user-plus text-[10px] ml-1.5 opacity-70" />
                </>
              )}
            </button>
          </div>

          {/* Botón Periodista Mock preservado para testing rápido */}
          <div className="mt-4 text-center">
            <button
              type="button"
              id="mock-login-press"
              onClick={() =>
                onLogin({
                  id: 'mock_press_user',
                  uid: 'mock_press_user',
                  email: 'press@sportsnote.com',
                  role: UserRole.PRESS,
                  name: 'Periodista Sn'
                })
              }
              className="text-[11px] text-white/30 hover:text-white/60 tracking-wider transition-colors uppercase font-mono cursor-pointer"
            >
              <i className="fa-solid fa-user-pen mr-1" /> MODO PERIODISTA (DEMO)
            </button>
          </div>
        </div>

        {/* Footer Inferior: Copyright & Cápsula Dual */}
        <div className="flex items-center justify-between w-full pt-6 text-xs text-gray-500 font-medium">
          <span>SportsNote © 2026</span>
          <div className="w-9 h-1.5 rounded-full bg-gradient-to-r from-[#c6ff00] to-[#6d5dfc] opacity-80 shadow-[0_0_8px_rgba(198,255,0,0.3)]" />
        </div>
      </div>
    </div>
  );
};

export default LoginView;
