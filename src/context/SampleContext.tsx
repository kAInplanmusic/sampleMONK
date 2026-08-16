import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PRESET_SAMPLE_DATABASE, AudioSample } from '../data/samples';
import { persistFile } from '../utils/opfs';

interface SampleContextType {
  samples: AudioSample[];
  selectedSample: AudioSample | null;
  setSelectedSample: (sample: AudioSample | null) => void;
  getSampleById: (id: string) => AudioSample | undefined;
  addSample: (sample: AudioSample) => void;
}

const SampleContext = createContext<SampleContextType | undefined>(undefined);

export const SampleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [samples, setSamples] = useState<AudioSample[]>(PRESET_SAMPLE_DATABASE);
  const [selectedSample, setSelectedSample] = useState<AudioSample | null>(null);

  const getSampleById = (id: string) => samples.find(s => s.id === id);
  const addSample = (sample: AudioSample) => {
    setSamples(prev => [...prev, sample]);
    // Task 15: bei Blob-URLs das Sample zusätzlich im OPFS zwischenspeichern.
    if (sample.url && sample.url.startsWith('blob:')) {
      fetch(sample.url)
        .then(r => r.blob())
        .then(blob => persistFile(sample.id + '.wav', blob))
        .catch(() => { /* OPFS optional, Fehler ignorieren */ });
    }
  };

  return (
    <SampleContext.Provider value={{ samples, selectedSample, setSelectedSample, getSampleById, addSample }}>
      {children}
    </SampleContext.Provider>
  );
};

export const useSamples = () => {
  const context = useContext(SampleContext);
  if (!context) throw new Error('useSamples must be used within a SampleProvider');
  return context;
};
