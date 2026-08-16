import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Mic, SlidersHorizontal, MonitorSpeaker, X } from 'lucide-react';
import * as Tone from 'tone';

/**
 * SettingsDialog – Audio-I/O & Device-Auswahl
 * -------------------------------------------
 * - Output (Soundkarte/Ausgabegerät) via `AudioContext.setSinkId()`.
 * - Input (Mikrofon/Line-in) via `getUserMedia`/`enumerateDevices()`.
 * - Sample-Rate & Buffer als Routing-Hinweis.
 * - Monitor-Routing-Flag (Stereo/DAW/Spatial).
 *
 * Alles wird in localStorage persistiert.
 */

interface SettingsStore {
  outputDeviceId: string;
  inputDeviceId: string;
  sampleRate: number;
  bufferHint: 'interactive' | 'balanced' | 'playback';
  stereoMode: 'STEREO' | 'DAW' | 'SPATIAL';
  monitorGain: number;
}

const DEFAULT_SETTINGS: SettingsStore = {
  outputDeviceId: '',
  inputDeviceId: '',
  sampleRate: 48000,
  bufferHint: 'interactive',
  stereoMode: 'STEREO',
  monitorGain: 0.8,
};

const getStored = (): SettingsStore => {
  try {
    const raw = localStorage.getItem('samplemonk_audio_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
};

export const useAudioSettings = () => {
  const [settings, setSettings] = useState<SettingsStore>(getStored);
  const persist = (next: SettingsStore) => {
    setSettings(next);
    try { localStorage.setItem('samplemonk_audio_settings', JSON.stringify(next)); } catch { /* ignore */ }
  };
  return { settings, update: persist };
};

export const SettingsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { settings, update } = useAudioSettings();
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [sinkSupported, setSinkSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!open) return;
    const ctx = Tone.context.rawContext as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    setSinkSupported(!!ctx?.setSinkId);

    navigator.mediaDevices?.enumerateDevices()
      .then(devs => {
        setOutputDevices(devs.filter(d => d.kind === 'audiooutput'));
        setInputDevices(devs.filter(d => d.kind === 'audioinput'));
      })
      .catch(() => { /* Permission/Hardware nicht verfügbar */ });
  }, [open]);

  const applyOutput = async (deviceId: string) => {
    update({ ...settings, outputDeviceId: deviceId });
    try {
      const ctx = Tone.context.rawContext as AudioContext & { setSinkId?: (id: string) => Promise<void> };
      if (typeof ctx?.setSinkId === 'function' && deviceId) await ctx.setSinkId(deviceId);
    } catch (e) {
      console.warn('setSinkId fehlgeschlagen:', (e as Error).message);
    }
  };

  const applyInput = async (deviceId: string) => {
    update({ ...settings, inputDeviceId: deviceId });
    // Mikrofon-Selektion wird beim Record/Voice genutzt (hier nur speichern).
    try { await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { ideal: deviceId } } }); } catch { /* Stille Fahrt */ }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" /> AUDIO / I/O
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Output */}
        <div className="mb-5">
          <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> Ausgabe (Soundkarte)
          </label>
          {!sinkSupported && <p className="text-[10px] text-amber-500 mb-1">Nur Browser-Umleitung; Soundcard muss im Browser gesetzt sein.</p>}
          <select
            className="w-full bg-neutral-800 text-white p-2 rounded border border-neutral-700"
            value={settings.outputDeviceId}
            onChange={e => applyOutput(e.target.value)}
          >
            <option value="">Browser-Standard</option>
            {outputDevices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || 'Audio-Ausgabegerät'}</option>
            ))}
          </select>
        </div>

        {/* Input */}
        <div className="mb-5">
          <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
            <Mic className="w-3.5 h-3.5 text-rose-500" /> Eingang (Mikro/Line)
          </label>
          <select
            className="w-full bg-neutral-800 text-white p-2 rounded border border-neutral-700"
            value={settings.inputDeviceId}
            onChange={e => applyInput(e.target.value)}
          >
            <option value="">System-Standard</option>
            {inputDevices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || 'Audio-Eingabegerät'}</option>
            ))}
          </select>
        </div>

        {/* Audio-Qualität */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5 mb-2 uppercase"><SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" /> Sample-Rate</label>
            <select
              className="w-full bg-neutral-800 text-white p-2 rounded border border-neutral-700"
              value={settings.sampleRate}
              onChange={e => update({ ...settings, sampleRate: Number(e.target.value) })}
            >
              <option value={44100}>44,1 kHz (Standard)</option>
              <option value={48000}>48 kHz (Film/DAW)</option>
              <option value={96000}>96 kHz (High-End)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5 mb-2 uppercase"><SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" /> Latenz-Profil</label>
            <select
              className="w-full bg-neutral-800 text-white p-2 rounded border border-neutral-700"
              value={settings.bufferHint}
              onChange={e => update({ ...settings, bufferHint: e.target.value as SettingsStore['bufferHint'] })}
            >
              <option value="interactive">Niedrig (Live/DJ)</option>
              <option value="balanced">Ausgeglichen</option>
              <option value="playback">Hoch (Mastering)</option>
            </select>
          </div>
        </div>

        {/* Routing / Ausgang */}
        <div className="mb-5">
          <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5 mb-2 uppercase"><MonitorSpeaker className="w-3.5 h-3.5 text-cyan-500" /> Master-Ausgangsmodus</label>
          <div className="grid grid-cols-3 gap-2">
            {(['STEREO', 'DAW', 'SPATIAL'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => update({ ...settings, stereoMode: mode })}
                className={`p-2 rounded border text-xs font-bold tracking-wider uppercase ${
                  settings.stereoMode === mode ? 'bg-cyan-900/30 border-cyan-500/60 text-cyan-300' : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Monitor-Gain */}
        <div>
          <label className="text-xs font-bold text-neutral-400 mb-2 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5"><MonitorSpeaker className="w-3.5 h-3.5 text-purple-500" /> Monitor-Kopfhörer-Pegel</span>
            <span className="text-purple-400">{Math.round(settings.monitorGain * 100)}%</span>
          </label>
          <input
            type="range" min="0" max="1" step="0.01" value={settings.monitorGain}
            onChange={e => update({ ...settings, monitorGain: parseFloat(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
};
