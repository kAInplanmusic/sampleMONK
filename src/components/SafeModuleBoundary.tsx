import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SafeModuleBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Plugin Module crashed:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/20 border border-red-500 rounded-lg text-red-400 text-xs font-mono flex items-center justify-between">
            <span>Modul-Fehler: Modul konnte nicht geladen werden.</span>
            <button
              onClick={this.handleReset}
              className="ml-4 px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-300 hover:bg-red-900 transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              Retry
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
