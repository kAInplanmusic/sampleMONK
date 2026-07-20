import React, { useState, useEffect } from 'react';
import { Radio, Mic, Save, Activity, Download, Play, Square, Circle } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

export function RecorderTerminal() {
  const { addSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('ACTIVE');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [takes, setTakes] = useState([
    { id: 1, name: 'Main_Mix_Take_01.wav', duration: '03:45', size: '38 MB', date: '2026-07-18' }
  ]);
  const [inputSource, setInputSource] = useState('MASTER_OUT');

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStop = () => {
    if (isRecording) {
      setIsRecording(false);
      const newTake = {
        id: takes.length + 1,
        name: `${inputSource}_Take_0${takes.length + 1}.wav`,
        duration: formatTime(recordTime),
        size: `${Math.max(1, Math.floor(recordTime * 0.15))} MB`,
        date: new Date().toISOString().split('T')[0]
      };
      setTakes([newTake, ...takes]);
      
      // Add recording to library
      const newSample: AudioSample = {
          id: `rec-${Date.now()}`,
          name: newTake.name,
          category: 'mids',
          type: 'Recording',
          description: `Master recording from ${inputSource}`,
          parameters: {}
      };
      addSample(newSample);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900/20 to-[#111] border-b border-indigo-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Radio className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Master Recorder <span className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-sm">BIT-PERFECT</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>

      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Left Column: Transport & Source */}
        <div className="w-1/2 flex flex-col gap-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex-1 flex flex-col items-center justify-center shadow-inner relative">
            <div className="absolute top-4 left-4">
               <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500">FORMAT: 32-BIT FLOAT / 96kHz</span>
            </div>
            
            <div className={`text-7xl font-mono font-black mb-8 transition-colors ${isRecording ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-neutral-700'}`}>
              {formatTime(recordTime)}
            </div>
            
            <div className="flex items-center gap-6">
              {!isRecording ? (
                <button 
                  onClick={() => { if (!(lockStatus.active && lockStatus.lockedBy !== 'localUser')) setIsRecording(true); }}
                  className="w-20 h-20 rounded-full bg-[#222] border-4 border-[#111] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-red-900 transition-colors group"
                >
                  <Circle className="w-8 h-8 text-red-500 fill-current group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
                </button>
              ) : (
                <button 
                  onClick={handleStop}
                  className="w-20 h-20 rounded-full bg-[#222] border-4 border-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                >
                  <Square className="w-8 h-8 text-red-500 fill-current" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-4">
            <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4" /> INPUT SOURCE
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {['MASTER_OUT', 'VOCAL_STEM', 'DRUM_BUS', 'SYNTH_GROUP'].map(src => (
                <button 
                  key={src}
                  onClick={() => { if (!(lockStatus.active && lockStatus.lockedBy !== 'localUser')) setInputSource(src); }}
                  className={`py-2 px-3 rounded border text-[10px] font-mono font-bold transition-all ${inputSource === src ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400' : 'bg-[#111] border-neutral-800 text-neutral-500 hover:bg-[#222]'}`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Takes Library */}
        <div className="w-1/2 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex flex-col shadow-inner">
          <h3 className="font-bold text-sm tracking-widest uppercase text-neutral-400 mb-4 flex items-center gap-2">
            <Save className="w-4 h-4 text-indigo-500" /> RECORDED TAKES
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-neutral-800">
            {takes.map(take => (
              <div key={take.id} className="p-4 rounded-lg bg-[#111] border border-neutral-800 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-4">
                  <button className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Play className="w-4 h-4 text-neutral-400 group-hover:text-white ml-0.5 fill-current" />
                  </button>
                  <div>
                    <div className="text-xs font-bold tracking-wider text-neutral-200">{take.name}</div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-1">{take.duration} • {take.size} • {take.date}</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded bg-[#222] border border-neutral-700 text-[10px] font-bold text-neutral-400 flex items-center gap-1 hover:bg-[#333] transition-colors">
                  <Download className="w-3 h-3" /> LIB
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
