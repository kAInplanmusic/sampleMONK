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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/20 border border-red-500 rounded-lg text-red-400 text-xs font-mono">
            Modul-Fehler: Modul konnte nicht geladen werden.
        </div>
      );
    }

    return this.props.children;
  }
}
