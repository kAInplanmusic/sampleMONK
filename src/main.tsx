import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { SampleProvider } from './context/SampleContext';
import { PluginManagerProvider } from './context/PluginManagerContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginManagerProvider>
      <SampleProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </SampleProvider>
    </PluginManagerProvider>
  </StrictMode>,
);
