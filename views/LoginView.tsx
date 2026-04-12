import React, { useState } from 'react';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { telemetryService } from '../services/telemetryService';
import { auth, googleProvider, signInWithPopup, db, collection, query, where, getDocs, signOut } from '../services/firebase';

interface LoginViewProps {
  onLogin: (user: { id: string, uid: string, email: string, role: UserRole, name: string, avatar?: string }) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      const role = userDoc.role as UserRole || UserRole.COACH; // Default fallback

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
      console.error("Login Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src="./assets/logoLargoSN.svg"
          alt="SportNotes Logo"
          className="w-64 md:w-80 h-auto mb-10 drop-shadow-2xl"
        />
        <p className="contrail-font text-onSurfaceVariant mb-16 text-center text-lg leading-tight tracking-wide opacity-80">
          Registra, Analiza, Comparte.
        </p>

        <div className="w-full space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center font-bold">
              {errorMsg}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full h-18 text-lg rounded-[32px] shadow-2xl shadow-primary/30 group relative overflow-hidden active:scale-95 transition-all flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="relative z-10 font-black tracking-widest uppercase truncate flex items-center gap-2">
              {loading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
              )}
              {loading ? 'CONECTANDO...' : 'INGRESA CON GOOGLE'}
            </span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Button>
        </div>

        <p className="mt-20 text-[10px] text-onSurfaceVariant/50 font-black tracking-[4px] uppercase italic">
          v1.5.0 Telemetry Edition
        </p>
      </div>
    </div>
  );
};

export default LoginView;
