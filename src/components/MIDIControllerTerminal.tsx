import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Keyboard, Activity, Link2, RefreshCw, Cpu, Layers } from 'lucide-react';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { useMIDI } from '../hooks/useMIDI';
import { useHID } from '../hooks/useHID';
import { audioEngine } from '../utils/audioEngine';
import { SkinEngine } from './midi/SkinEngine';
import { MidiDeviceType } from '../config/midiDevices';

export function MIDIControllerTerminal() {
  const { state, lockStatus, updateState } = usePluginState('midi', 'PRO');
  const { midiAccess, lastMessage, detected } = useMIDI();
  const { devices } = useHID();
  const [activeProfile, setActiveProfile] = useState('APC40');
  const isConnected = !!midiAccess || devices.length > 0;
  const [padMappings, setPadMappings] = useState<Record<number, AudioSample>>({});

  // AUTO-ERKENNUNG: Sobald ein MIDI-Gerät erkannt wird, dessen Profil bekannt ist,
  // aktiviere automatisch das passende Profil (Plug-and-Play).
  useEffect(() => {
    if (detected.length === 0) return;
    const known = detected.find(d => d.profile !== 'UNKNOWN');
    if (known) {
      setActiveProfile(known.profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detected]);

  useEffect(() => {
    if (!lastMessage?.data || lastMessage.data.length < 3) return;
    
    const [status, note, velocity] = lastMessage.data;
    // Validate MIDI data ranges
    if (typeof status !== 'number' || typeof note !== 'number' || typeof velocity !== 'number') return;
    
    const messageType = status & 0xF0; // Extract message type (upper nibble)
    
    // Handle Note On (0x90 = 144)
    if (messageType === 0x90 && velocity > 0) {
        const padIndex = note % 40;
        const sample = padMappings[padIndex];
        if (sample?.url) {
            audioEngine.previewSample('channel5', undefined, sample.url);
        }
    }
    // Handle Control Change (0xB0 = 176) - faders, knobs
    else if (messageType === 0xB0) {
        const ccNumber = note;
        const ccValue = velocity;
        // Map CC values to engine parameters (0-127 → normalized)
        const normalized = ccValue / 127;
        audioEngine.setWorkletParam(`cc_${ccNumber}`, normalized);
    }
  }, [lastMessage, padMappings]);
  
  // Mappe Profil-ID → Gerätetyp für die generische Skin-Engine.
  const profileType = (id: string): MidiDeviceType =>
    id.includes('DDJ') || id.includes('REV') || id.includes('TRAKTOR') || id.includes('INPULSE') || id.includes('DENON') ? 'DJ'
    : id === 'MPC' || id === 'Maschine' ? 'MPC'
    : id === 'MPD' ? 'PAD'
    : id === 'KEYBOARD' ? 'KEYBOARD'
    : 'GRID';

  const profiles = [
    { id: 'APC40', name: 'AKAI APC40 MKII', type: 'Grid- & Clip-Launcher' },
    { id: 'PUSH2', name: 'ABLETON PUSH 2', type: 'Grid- & Clip-Launcher' },
    { id: 'LAUNCHPAD', name: 'NOVATION LAUNCHPAD', type: 'Grid- & Clip-Launcher' },
    { id: 'DDJ', name: 'PIONEER DDJ-Serie', type: 'DJ-Controller' },
    { id: 'REV', name: 'PIONEER DDJ-REV', type: 'DJ-Controller' },
    { id: 'TRAKTOR', name: 'NI TRAKTOR KONTROL', type: 'DJ-Controller' },
    { id: 'INPULSE', name: 'HERCULES INPULSE', type: 'DJ-Controller' },
    { id: 'DENON', name: 'DENON DJ PRIME', type: 'DJ-Controller' },
    { id: 'MPC', name: 'AKAI MPC-Serie', type: 'Finger-Drumming & Pads' },
    { id: 'MASCHINE', name: 'NI MASCHINE', type: 'Finger-Drumming & Pads' },
    { id: 'MPD', name: 'AKAI MPD-Serie', type: 'Finger-Drumming & Pads' },
    { id: 'KEYBOARD', name: 'Keyboard-Controller', type: 'Melodie & Synthese' },
    { id: 'DAW', name: 'DAW/Mixer-Controller', type: 'Automation & Mixing' },
  ];

  const groupedProfiles = useMemo(() => profiles.reduce((acc: any, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {}), []);

  const handleSampleDrop = (sample: AudioSample, padIndex: number) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setPadMappings(prev => ({ ...prev, [padIndex]: sample }));
    // console.log(`Sample ${sample.name} mapped to pad ${padIndex + 1}`);
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-900/20 to-[#111] border-b border-pink-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Keyboard className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              MIDI Control <span className="text-[10px] font-mono text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-sm">HARDWARE LINK</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AUTO_AI">AI</option>
            <option value="PRO">ACTIVE</option>
        </select>
        
        <div className={`px-4 py-2 rounded border flex items-center gap-2 text-xs font-bold tracking-widest ${isConnected ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
          {isConnected ? <Link2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {isConnected ? 'USB SYNCED' : 'DISCONNECTED'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left: Profiles */}
        <div className="w-1/3 flex flex-col gap-4">
           <h3 className="font-bold text-sm tracking-widest uppercase text-neutral-400 flex items-center gap-2 mb-4">
             <Cpu className="w-4 h-4 text-pink-500" /> MAPPED HARDWARE
           </h3>
           
           <div className="flex-1 overflow-y-auto space-y-4">
            {Object.entries(groupedProfiles).map(([type, items]) => (
                <div key={type}>
                    <h4 className="text-[10px] font-bold text-neutral-600 uppercase mb-2">{type}</h4>
                    <div className="space-y-2">
                        {(items as any[]).map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProfile(p.id)}
                                className={`w-full p-3 rounded-lg border text-left transition-all ${activeProfile === p.id ? 'bg-pink-900/20 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'bg-[#1a1a1a] border-neutral-800 hover:bg-[#222]'}`}
                            >
                                <span className={`text-sm font-black ${activeProfile === p.id ? 'text-pink-400' : 'text-neutral-300'}`}>{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
           </div>
           
           <div className="mt-auto">
             <button className="w-full py-3 bg-[#222] hover:bg-[#333] border border-neutral-700 rounded text-xs font-bold tracking-widest text-neutral-400 flex items-center justify-center gap-2 transition-colors">
               <RefreshCw className="w-4 h-4" /> RESCAN USB PORTS
             </button>
           </div>
        </div>
        
        {/* Right: Hardware Mirror */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 shadow-inner flex flex-col relative overflow-hidden">
           
           <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
              <span className="text-[10px] font-mono text-pink-500">MIDI IN/OUT RX/TX</span>
           </div>
           
           {/* Parametrischer Canvas-Skin des erkannten Profils (Plug-and-Play) */}
           <div className="flex-1 flex flex-col justify-center gap-4">
             {(() => {
               // Pads, die einem Sample zugeordnet sind, als LEUCHTENDE Pads in der Skin
               const padMap: Record<number, boolean> = {};
               const padCol: Record<number, string> = {};
               Object.entries(padMappings).forEach(([k, sample]) => {
                 const n = Number(k);
                 padMap[n] = true;
                 padCol[n] = sample ? '#f472b6' : '#9f7aea';
               });
               return (
                 <SkinEngine
                   type={profileType(activeProfile)}
                   cols={activeProfile === 'APC40' ? 8 : 8}
                   rows={5}
                   state={{
                     pads: padMap,
                     padColors: padCol,
                     encoders: Array.from({ length: 8 }, (_, i) => Math.random()),
                     faders: Array.from({ length: 8 }, (_, i) => Math.random()),
                     label: activeProfile,
                   }}
                 />
               );
             })()}

             {/* Zuordnungshinweis */}
             <div className="text-center text-[10px] font-mono text-neutral-500">
               Profil: <span className="text-pink-400">{activeProfile}</span> · Drag & Drop Samples auf die Pads
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
