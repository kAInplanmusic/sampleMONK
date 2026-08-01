import React, { useState, useRef } from 'react';
import { Mic, Play, Download, Settings, RefreshCw, Volume2, AlignLeft, Wand2 } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { useAudioAI } from '../hooks/useAudioAI';
import { PitchDetector } from '../utils/PitchDetector';
import { audioEngine } from '../utils/audioEngine';
import { useAudio } from '../context/AudioContext';

export function VoiceGenTerminal({ enabled = true }: { enabled?: boolean }) {
  const { addSample } = useSamples();
  const { generateVoice } = useAudioAI();
  const { state, lockStatus, updateState } = usePluginState('voice_gen', 'ACTIVE');
  const [prompt, setPrompt] = useState('Dark warehouse techno vocals saying "Are you ready to lose control"');
  
  const [style, setStyle] = useState('SPOKEN'); // SPOKEN, CHANT, SINGING
  const [voice, setVoice] = useState('FEMALE_ROBOTIC');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [isRecordingMidi, setIsRecordingMidi] = useState(false);
  const midiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { audioContext } = useAudio();

  if (!enabled) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#111] rounded-xl border border-neutral-800 text-neutral-600 font-mono text-xs uppercase tracking-widest">
            Voice Generator Disabled
        </div>
    );
  }

  const startRecordingForMIDI = async () => {
    if (isRecordingMidi) {
        if (midiIntervalRef.current) clearInterval(midiIntervalRef.current);
        setIsRecordingMidi(false);
        return;
    }
    
    await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!audioContext) {
        console.warn("AudioContext not available for PitchDetector.");
        return;
    }
    const detector = new PitchDetector(audioContext);
    
    setIsRecordingMidi(true);
    const interval = setInterval(() => {
        const note = detector.getNote();
        // console.log("Detected Pitch:", note);
        audioEngine.triggerEvent('channel5', 0.8);
    }, 100);
    
    midiIntervalRef.current = interval as any;
  };


  const generate = async () => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setIsGenerating(true);
    setHasResult(false);
    
    try {
      const data = await generateVoice(prompt, voice);
      // console.log("Voice generation response:", data);
      
      // Simulate finish
      setTimeout(() => {
        setIsGenerating(false);
        setHasResult(true);

        // Add generated vocal to library
        const newSample: AudioSample = {
            id: `vocal-${Date.now()}`,
            name: `Vocal_${voice}_${Date.now()}`,
            category: 'mids',
            type: 'Vocal',
            description: `Generated vocal: "${prompt}"`,
            tags: ["Vocal", "AI"],
            parameters: {}
        };
        addSample(newSample);
      }, 3000);
      
    } catch (error) {
      console.error("Voice generation failed:", error);
      setIsGenerating(false);
    }
  };

  const voices = ['FEMALE_ROBOTIC', 'MALE_GRITTY', 'ETHEREAL_CHOIR', 'DISTORTED_DEMON', 'AI_NEWSCASTER'];

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-900/20 to-[#111] border-b border-orange-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Mic className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Voice Generator <span className="text-[10px] font-mono text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-sm">AI VOCALIST</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Input & Settings */}
        <div className="w-1/2 p-8 border-r border-neutral-800 flex flex-col gap-6 bg-[#161616]">
          
          <div>
            <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> LYRICS / PROMPT
            </label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-[#111] border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 focus:outline-none focus:border-orange-500/50 resize-none font-mono"
              placeholder="Enter text to synthesize..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">DELIVERY STYLE</label>
              <div className="flex flex-col gap-2">
                {['SPOKEN', 'CHANT', 'SINGING'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-2 rounded-md border text-xs font-bold tracking-widest transition-all ${style === s ? 'bg-orange-900/40 border-orange-500 text-orange-400' : 'bg-[#111] border-neutral-800 text-neutral-500 hover:text-neutral-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">VOICE MODEL</label>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-neutral-800 pr-2">
                {voices.map(v => (
                  <button 
                    key={v}
                    onClick={() => setVoice(v)}
                    className={`py-2 px-3 rounded-md border text-[10px] font-mono text-left transition-all truncate ${voice === v ? 'bg-neutral-800 border-neutral-600 text-neutral-200' : 'bg-[#111] border-transparent text-neutral-500 hover:bg-[#1a1a1a]'}`}
                  >
                    {v.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-neutral-800 flex flex-col gap-3">
            <button 
              onClick={startRecordingForMIDI}
              className={`w-full py-3 rounded-lg font-bold tracking-widest flex justify-center items-center gap-2 transition-all ${isRecordingMidi ? 'bg-red-900/50 text-red-400' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              <Mic className="w-4 h-4" /> {isRecordingMidi ? 'STOP RECORDING' : 'RECORD VOICE-TO-MIDI'}
            </button>
            <button 
              onClick={generate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg font-black tracking-widest flex justify-center items-center gap-3 transition-all ${isGenerating ? 'bg-neutral-800 text-neutral-500 cursor-wait' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]'}`}
            >
              {isGenerating ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> SYNTHESIZING...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> GENERATE VOCAL</>
              )}
            </button>
          </div>
          
        </div>
        
        {/* Right Side: Result & Processing */}
        <div className="w-1/2 p-8 flex flex-col bg-[#111] relative">
           
           {!hasResult && !isGenerating ? (
             <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <Mic className="w-24 h-24 mb-4" />
               <p className="font-bold tracking-widest">READY TO SYNTHESIZE</p>
             </div>
           ) : isGenerating ? (
             <div className="flex-1 flex flex-col items-center justify-center">
               <div className="w-full flex items-center justify-center gap-2 mb-8">
                 {[...Array(20)].map((_, i) => (
                   <div 
                     key={i} 
                     className="w-1.5 bg-orange-500 rounded-full animate-pulse" 
                     style={{ height: `${Math.random() * 40 + 10}px`, animationDelay: `${i * 0.1}s` }}
                   ></div>
                 ))}
               </div>
               <p className="text-orange-400 font-mono text-xs animate-pulse">Running TTS Model...</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-500">
               
               <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 shadow-inner relative overflow-hidden group">
                 <div className="relative z-10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <button className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-105 transition-transform">
                       <Play className="w-6 h-6 ml-1 fill-current" />
                     </button>
                     <div>
                       <h4 className="font-black text-lg tracking-widest">vocal_take_01.wav</h4>
                       <p className="text-xs text-neutral-400 font-mono mt-1">{style} • {voice}</p>
                     </div>
                   </div>
                   
                   <button className="px-4 py-2 bg-[#222] border border-neutral-700 hover:bg-[#333] rounded flex items-center gap-2 text-xs font-bold transition-colors">
                     <Download className="w-4 h-4" /> EXPORT TO LIB
                   </button>
                 </div>
               </div>
             </div>
           )}
           
        </div>
        
      </div>
    </div>
  );
}
