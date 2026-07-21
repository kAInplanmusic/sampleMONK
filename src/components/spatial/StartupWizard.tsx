// src/components/spatial/StartupWizard.tsx
import React, { useState } from 'react';
import { SpeakerSetup, SpatialSetup } from './types';
import { Box, Ruler } from 'lucide-react';

interface StartupWizardProps {
  onComplete: (setup: SpatialSetup) => void;
}

export const StartupWizard: React.FC<StartupWizardProps> = ({ onComplete }) => {
  const [width, setWidth] = useState(3);
  const [depth, setDepth] = useState(4);
  const [setup, setSetup] = useState<SpeakerSetup>('10.0-EarLevel');

  return (
    <div className="bg-[#111] p-8 rounded-xl border border-neutral-800 text-white w-full max-w-lg">
      <h2 className="text-xl font-black mb-6 text-sky-400">Raum- & Setup-Matrix</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-mono text-neutral-500">Raumgröße (Meter)</label>
          <div className="flex gap-4 mt-2">
            <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="bg-[#222] p-2 rounded w-full" placeholder="Breite" />
            <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} className="bg-[#222] p-2 rounded w-full" placeholder="Tiefe" />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-neutral-500">Lautsprecher-Setup</label>
          <select value={setup} onChange={e => setSetup(e.target.value as SpeakerSetup)} className="w-full bg-[#222] p-2 rounded mt-2">
            <option value="10.0-EarLevel">10.0 – Ear Level</option>
            <option value="7.1-Surround">7.1 – Surround</option>
            <option value="Stereo">Stereo</option>
          </select>
        </div>

        <button 
          onClick={() => onComplete({ roomWidth: width, roomDepth: depth, speakerSetup: setup, isPhysicalSetupValid: true })}
          className="w-full bg-sky-600 hover:bg-sky-500 p-3 rounded font-bold text-sm mt-6"
        >
          Setup initialisieren
        </button>
      </div>
    </div>
  );
};
