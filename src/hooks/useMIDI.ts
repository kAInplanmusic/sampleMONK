import { useState, useEffect } from 'react';

export const useMIDI = () => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [lastMessage, setLastMessage] = useState<MIDIMessageEvent | null>(null);

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(access => {
        setMidiAccess(access);
        const inputsArray = Array.from(access.inputs.values());
        setInputs(inputsArray);
        
        inputsArray.forEach(input => {
          input.onmidimessage = (message) => {
            setLastMessage(message);
          };
        });
      }).catch(err => console.error('MIDI Access denied:', err));
    }
  }, []);

  return { midiAccess, inputs, lastMessage };
};
