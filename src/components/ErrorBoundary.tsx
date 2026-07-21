import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono p-4">
          <div className="border border-red-500/30 p-8 rounded-lg bg-red-950/10">
            <h1 className="text-2xl font-bold mb-4">CRITICAL UI ERROR</h1>
            <p className="text-sm">Das Sample Monk System ist abgestürzt. Bitte die Konsole prüfen.</p>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
