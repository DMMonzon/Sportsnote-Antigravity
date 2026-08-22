import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0a21] text-white p-6 text-center font-lato">
          <div className="max-w-md bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-3xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 className="contrail-font text-2xl uppercase tracking-wider text-white">Algo salió mal</h2>
            <p className="text-xs text-white/70 leading-relaxed uppercase font-bold">
              Ha ocurrido un error inesperado al cargar esta sección. Puedes reintentar o regresar al panel principal.
            </p>
            {this.state.error && (
              <div className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-mono text-red-300 overflow-x-auto text-left max-h-24">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10"
              >
                Reintentar
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
