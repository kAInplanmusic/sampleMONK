import { useState, useEffect } from 'react';

export const useMIDI = () => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [lastMessage, setLastMessage] = useState<MIDIMessageEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.isSecureContext && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(access => {
        setMidiAccess(access);
        const inputsArray = Array.from(access.inputs.values());
        setInputs(inputsArray);
        
        inputsArray.forEach(input => {
          input.onmidimessage = (message) => {
            setLastMessage(message);
          };
        });
      }).catch(err => {
        const msg = `MIDI Access denied: ${err.message || 'Unknown error'}`;
        setError(msg);
        console.error(msg);
      });
    } else {
      const msg = !window.isSecureContext 
        ? 'MIDI Access not available: Site not served over HTTPS.'
        : 'MIDI Access not supported by this browser.';
      setError(msg);
      console.warn(msg);
    }
  }, []);

  return { midiAccess, inputs, lastMessage, error };
};
