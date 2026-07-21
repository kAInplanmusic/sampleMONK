import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { SampleProvider } from './context/SampleContext';
import { ModuleStateProvider } from './context/ModuleStateContext';
import { PluginManagerProvider } from './context/PluginManagerContext';
import { SessionProvider } from './context/SessionContext';
import { AccessProvider } from './context/AccessContext';

import { ErrorBoundary } from './components/ErrorBoundary';
// ...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
        <AccessProvider>
        <SessionProvider>
            <ModuleStateProvider>
            <PluginManagerProvider>
                <SampleProvider>
                <AudioProvider>
                    <App />
                </AudioProvider>
                </SampleProvider>
            </PluginManagerProvider>
            </ModuleStateProvider>
        </SessionProvider>
        </AccessProvider>
    </ErrorBoundary>
  </StrictMode>,
);
