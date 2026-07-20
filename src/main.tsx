import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { SampleProvider } from './context/SampleContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SampleProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </SampleProvider>
  </StrictMode>,
);
