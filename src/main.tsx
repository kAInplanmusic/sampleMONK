import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { SampleProvider } from './context/SampleContext';
import { ModuleStateProvider } from './context/ModuleStateContext';
import { SessionProvider } from './context/SessionContext';
import { ModuleStateProvider } from './context/ModuleStateContext';
// ...
createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
);
