import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import { usePluginState } from '../hooks/usePluginState';

export function PerformanceMonitorTerminal() {
  const { state, lockStatus, updateState } = usePluginState('perf_mon', 'ACTIVE');
  const [metrics, setMetrics] = useState({ cpu: 0, latency: 0, jitter: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real metrics tracking
      setMetrics({
        cpu: Math.random() * 20 + 10, // %
        latency: Math.random() * 5 + 2, // ms
        jitter: Math.random() * 1, // ms
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} p-6 text-neutral-300 font-mono shadow-2xl`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> SYSTEM HEALTH
        </h3>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] p-4 rounded-lg border border-neutral-800">
            <div className="text-[10px] text-neutral-500 mb-1">CPU LOAD</div>
            <div className="text-2xl font-black text-emerald-400">{metrics.cpu.toFixed(1)}%</div>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-lg border border-neutral-800">
            <div className="text-[10px] text-neutral-500 mb-1">LATENCY</div>
            <div className="text-2xl font-black text-sky-400">{metrics.latency.toFixed(1)}ms</div>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-lg border border-neutral-800">
            <div className="text-[10px] text-neutral-500 mb-1">JITTER</div>
            <div className="text-2xl font-black text-amber-400">{metrics.jitter.toFixed(1)}ms</div>
        </div>
      </div>
    </div>
  );
}
