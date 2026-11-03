import React from 'react';

export interface StepItem {
  id: number;
  label: string;
}

export const PREGAME_STEPS: StepItem[] = [
  { id: 1, label: 'DEPORTE' },
  { id: 2, label: 'DATOS GENERALES' },
  { id: 3, label: 'EQUIPO LOCAL' },
  { id: 4, label: 'EQUIPO VISITANTE' },
  { id: 5, label: 'CONFIRMACIÓN' }
];

interface PregameStepperProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const PregameStepper: React.FC<PregameStepperProps> = ({ currentStep, onStepClick }) => {
  const percentage = Math.round((currentStep / 5) * 100);

  return (
    <div className="w-full flex flex-col gap-1.5 mb-2 select-none">
      {/* Contenedor horizontal de los 5 pasos */}
      <div className="flex items-center justify-between w-full overflow-x-auto no-scrollbar gap-2 pb-1">
        {PREGAME_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isPending = step.id > currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                // Permitir volver a pasos ya completados
                if (isCompleted && onStepClick) {
                  onStepClick(step.id);
                }
              }}
              disabled={isPending}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 shrink-0 text-xs tracking-wider ${
                isActive
                  ? 'bg-[#121824] border border-[#c6ff00]/60 shadow-[0_0_15px_rgba(198,255,0,0.15)] text-white font-black'
                  : isCompleted
                  ? 'bg-white/5 border border-white/10 hover:border-white/20 text-white/80 cursor-pointer font-bold'
                  : 'bg-white/[0.02] border border-white/5 text-white/30 cursor-not-allowed font-medium'
              }`}
            >
              {isActive && (
                <span className="w-5 h-5 rounded-full bg-[#c6ff00] text-black font-black text-[11px] flex items-center justify-center shadow-sm">
                  {step.id}
                </span>
              )}

              {isCompleted && (
                <span className="w-5 h-5 rounded-full bg-white/10 text-[#c6ff00] font-black text-[10px] flex items-center justify-center">
                  <i className="fa-solid fa-check"></i>
                </span>
              )}

              {isPending && (
                <i className="fa-solid fa-lock text-[10px] text-white/25"></i>
              )}

              <span className={`uppercase font-sans ${isActive ? 'text-white' : ''}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de progreso dinámica */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1 relative">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-[#c6ff00] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(198,255,0,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Microindicador a la derecha */}
      <div className="flex justify-end items-center mt-0.5">
        <span className="text-[11px] font-mono text-white/70 flex items-center gap-1.5 tracking-tight">
          <span className="w-2 h-2 rounded-full bg-[#c6ff00] shadow-[0_0_8px_#c6ff00] inline-block animate-pulse"></span>
          Paso {currentStep} de 5 • {percentage}%
        </span>
      </div>
    </div>
  );
};

export default PregameStepper;
