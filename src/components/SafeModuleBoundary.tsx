import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

// Extrahiert einen lesbaren Namen des gerenderten Moduls (z.B. 'SequencerPluginTerminal'),
// damit ein Crash eindeutig zuzuordnen ist.
function resolveElementName(children: ReactNode): string {
  if (Array.isArray(children)) {
    return children.map(resolveElementName).filter(Boolean).join(', ');
  }
  if (children && typeof children === 'object' && 'type' in (children as any)) {
    const type = (children as any).type;
    if (typeof type === 'string') return type;             // DOM-Element
    if (type && type.displayName) return type.displayName;  // benannte Funktion/Klasse
    if (type && type.name) return type.name;                // Funktionsname / Klassenname
    return 'Unbekanntes Modul-Element';
  }
  return '(kein Element)';
}

interface State {
  hasError: boolean;
  moduleName: string;
}

export class SafeModuleBoundary extends Component<Props, State> {
  private crashedModuleName = '';
  public state: State = {
    hasError: false,
    moduleName: ''
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.crashedModuleName = resolveElementName(this.props.children);
    console.error(`Plugin Module crashed (${this.crashedModuleName}):`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/20 border border-red-500 rounded-lg text-red-400 text-xs font-mono flex items-center justify-between">
            <span>Modul-Fehler {this.crashedModuleName ? `[${this.crashedModuleName}]` : ''}: Modul konnte nicht geladen werden.</span>
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
