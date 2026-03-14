import React, { useState } from 'react';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { telemetryService } from '../services/telemetryService';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.COACH);

  const handleEnter = () => {
    // Generar o recuperar UUID
    telemetryService.getUUID();
    onLogin(selectedRole);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src="./assets/logoLargoSN.svg"
          alt="Sportsnote Logo"
          className="w-64 md:w-80 h-auto mb-10 drop-shadow-2xl"
        />
        <p className="contrail-font text-onSurfaceVariant mb-16 text-center text-lg leading-tight tracking-wide opacity-80">
          Registra, Analiza, Comparte.
        </p>

        <div className="w-full space-y-8">

          <Button
            variant="primary"
            className="w-full h-18 text-lg rounded-[32px] shadow-2xl shadow-primary/30 group relative overflow-hidden active:scale-95 transition-all"
            onClick={handleEnter}
          >
            <span className="relative z-10 font-black tracking-widest uppercase">INGRESAR A LA APP 🚀</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Button>
        </div>

        <p className="mt-20 text-[10px] text-onSurfaceVariant/50 font-black tracking-[4px] uppercase italic">
          v1.5.0 Telemetry Edition
        </p>
      </div>
    </div >
  );
};

export default LoginView;
