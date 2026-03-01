
import React from 'react';
import { UserRole } from '../types';
import { ROLES } from '../constants';
import { Button } from '../components/Button';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <img
        src="/assets/logoLargoSN.svg"
        alt="Sportsnote Logo"
        className="w-64 md:w-80 h-auto mb-10 drop-shadow-xl"
      />
      <p className="contrail-font text-onSurfaceVariant mb-12 text-center text-lg leading-tight tracking-wide">Registra, Analiza, Comparte.</p>

      <div className="w-full max-w-xs flex flex-col gap-4">
        {ROLES.map((role) => (
          <Button
            key={role.id}
            variant="tonal"
            className="w-full h-16 flex-row justify-start pl-8 gap-6 rounded-[28px] border-surfaceVariant"
            onClick={() => onLogin(role.id)}
          >
            <span className="text-3xl grayscale-0">{role.icon}</span>
            <div className="text-left">
              <div className="contrail-font text-onSecondaryContainer font-bold text-base leading-none">{role.title}</div>
              <div className="lato-font text-onSurfaceVariant text-[10px] normal-case font-medium mt-1">Acceso Profesional</div>
            </div>
          </Button>
        ))}
      </div>

      <p className="mt-16 text-[10px] text-onSurfaceVariant opacity-60 font-black tracking-widest uppercase">v1.4.0 Material Edition</p>
    </div >
  );
};

export default LoginView;
