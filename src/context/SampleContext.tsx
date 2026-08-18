import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PRESET_SAMPLE_DATABASE, AudioSample } from '../data/samples';
import { persistFile, listSamples } from '../utils/opfs';

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

  // P7: OPFS-basierte Samples beim Provider-Mount laden und in den State
  // einbinden (nur neue, noch nicht vorhandene Einträge). Läuft deterministisch
  // und offline im Hintergrund; bei OPFS-Verfügbarkeit werden die Dateinamen
  // als nutzbare Samples ergänzt.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const names = await listSamples();
      if (cancelled) return;
      const existing = new Set(samples.map((s) => s.id));
      const news: AudioSample[] = names
        .filter((n) => !existing.has(n))
        .map((n) => ({
          id: n,
          name: n.replace(/\.(wav|mp3|ogg|flac|aiff)$/i, '').replace(/_/g, ' '),
          category: 'mids' as const,
          type: 'OPFS',
          description: 'Lokale OPFS-Datei',
          tags: ['local', 'opfs'],
          url: undefined,
          parameters: {},
        }));
      if (news.length > 0) setSamples((prev) => [...prev, ...news]);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
