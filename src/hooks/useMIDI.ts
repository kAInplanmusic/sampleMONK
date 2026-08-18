import { useState, useEffect, useCallback } from 'react';
import { resolveMidiProfile, MidiDeviceType } from '../config/midiDevices';

export interface DetectedMidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
  profile: string;
  type: MidiDeviceType;
}

/** Erweiterter MIDI-Hook mit Auto-Erkennung + Hotplug. */
export const useMIDI = () => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [outputs, setOutputs] = useState<MIDIOutput[]>([]);
  const [lastMessage, setLastMessage] = useState<MIDIMessageEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Auto-Erkannte, gelöste Geräte (pro Thread/Policy).
  const [detected, setDetected] = useState<DetectedMidiDevice[]>([]);

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const ins = Array.from(access.inputs.values());
    const outs = Array.from(access.outputs.values());
    setInputs(ins);
    setOutputs(outs);

    // Auto-Erkennung: jedes Input-Gerät zum Profil auflösen.
    const merged: DetectedMidiDevice[] = [];
    ins.forEach(i => {
      const profile = resolveMidiProfile(i.name ?? '', i.manufacturer ?? undefined);
      merged.push({
        id: i.id,
        name: i.name ?? 'Unbekanntes MIDI-Gerät',
        manufacturer: i.manufacturer ?? undefined,
        profile: profile?.profile ?? 'UNKNOWN',
        type: profile?.type ?? 'PAD',
      });
    });
    setDetected(merged);
  }, []);

  useEffect(() => {
    if (!window.isSecureContext || !navigator.requestMIDIAccess) {
      const msg = !window.isSecureContext
        ? 'MIDI nicht verfügbar: Site ist nicht über HTTPS (oder localhost).'
        : 'MIDI wird von diesem Browser nicht unterstützt.';
      setError(msg);
      console.warn(msg);
      return;
    }

    navigator.requestMIDIAccess({ sysex: false }).then(access => {
      setMidiAccess(access);
      refreshDevices(access);

      // Hotplug: auf neue Geräte reagieren (Plug-and-Play).
      access.onstatechange = (event) => {
        const dev = event.port;
        // Kleinere Verzögerung zum stabilen Enumeration-Update
        setTimeout(() => refreshDevices(access), 60);
        // Nachricht ggf. kurz loggen (nur bei Verbindung sichtbar)
        if (dev && dev.state === 'connected') {
          console.info(`MIDI-Hotplug verbunden: ${dev.name}`);
        }
      };

      // Message-Subscription für aktuelle Inputs
      Array.from(access.inputs.values()).forEach(input => {
        input.onmidimessage = (message) => setLastMessage(message);
      });
    }).catch(err => {
      const msg = `MIDI Access verweigert: ${err.message || 'Unbekannt'}`;
      setError(msg);
      console.error(msg);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { midiAccess, inputs, outputs, detected, lastMessage, error, refreshDevices };
};
