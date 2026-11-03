import React from 'react';

interface PregameFooterProps {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
  isScheduleMode?: boolean;
  isSubmitting?: boolean;
}

export const PregameFooter: React.FC<PregameFooterProps> = ({
  currentStep,
  onPrev,
  onNext,
  onCancel,
  isScheduleMode = false,
  isSubmitting = false
}) => {
  const isFirstStep = currentStep === 1;
  const isFinalStep = currentStep === 5;

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 w-full select-none">
      {/* Botón Izquierdo (Secundario) */}
      {isFirstStep ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-5 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <span>←</span>
          <span>Cancelar y volver</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onPrev}
            className="bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-5 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-white/40 hover:text-white/70 transition-colors uppercase font-mono px-2 py-1"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Botón Derecho (Primario Destacado Verde Lima) */}
      <button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-[#c6ff00] text-black font-black hover:bg-[#b3ea00] rounded-xl px-7 py-3 text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(198,255,0,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>VERIFICANDO...</span>
          </>
        ) : isFinalStep ? (
          isScheduleMode ? (
            <>
              <span>PROGRAMAR JUEGO</span>
              <i className="fa-solid fa-calendar-check ml-1"></i>
            </>
          ) : (
            <>
              <span>COMENZAR JUEGO</span>
              <span>→</span>
            </>
          )
        ) : (
          <>
            <span>SIGUIENTE</span>
            <span>→</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PregameFooter;
