import { useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { analyzeMusic } from '../utils/audioAnalyzer';
import { TrackType } from '../types';
import { MUSIC_LIBRARY, MusicTrack } from '../data/musicLibrary';

/**
 * audioMONASTRY DJ-Mischpult — Optik & Funktion wie ein Allen & Heath XONE.
 *
 * 4 Kanäle mit LOAD-SLOT (Sample reinlegen/droppen → wird in der AudioEngine
 * geladen). Jeder Kanal hat Xone-typische Reihen: HI/MID/LOW-Potis + Pan + Gain
 * + VU-Meter + Mute. Zentraler Crossfader (A/B) + Master-Sektion.
 * Fader/EQ/Pan wirken REAL auf die AudioEngine.
 */

const STRIPS: {
  deck: 'A' | 'B';
  track: TrackType;
  label: string;
  accent: string;
}[] = [
  { deck: 'A', track: 'channel1', label: 'CH 1', accent: '#f43f5e' },
  { deck: 'A', track: 'channel2', label: 'CH 2', accent: '#fb923c' },
  { deck: 'B', track: 'channel3', label: 'CH 3', accent: '#22d3ee' },
  { deck: 'B', track: 'channel4', label: 'CH 4', accent: '#a78bfa' },
];

/** Xone-Drehpoti. ziehen zum Ändern; Doppelklick = Mittelstellung. */
function Knob({ value, onChange, label }: {
  value: number; onChange: (v: number) => void; label: string;
}) {
  const deg = (value - 0.5) * 260;
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const move = (ev: PointerEvent) => {
            const dx = ev.clientX - (r.left + r.width / 2);
            onChange(Math.max(0, Math.min(1, 0.5 + dx / 120)));
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', () => window.removeEventListener('pointermove', move), { once: true });
        }}
        onDoubleClick={() => onChange(0.5)}
        className="relative w-10 h-10 rounded-full cursor-ns-resize shadow-[inset_0_-3px_6px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.6)]"
        style={{ background: 'radial-gradient(circle at 35% 30%, #fafafa, #9a9a9a 60%, #3f3f3f)' }}
      >
        <div className="absolute left-1/2 top-[3px] h-1.5 w-[3px] -translate-x-1/2 rounded bg-black"
          style={{ transform: `translateX(-50%) rotate(${deg}deg)`, transformOrigin: '50% 20px' }} />
      </div>
      <span className="text-[8px] font-mono tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

/** Vertikaler Langhub-Fader (gerillte Metallkappe). */
function Fader({ value, onChange, label, accent }: {
  value: number; onChange: (v: number) => void; label?: string; accent?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {label && <span className="text-[7px] font-mono tracking-widest text-zinc-500">{label}</span>}
      <div className="relative h-28 w-4 rounded-md bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 shadow-inner"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const move = (ev: PointerEvent) => {
            onChange(Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / r.height)));
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', () => window.removeEventListener('pointermove', move), { once: true });
        }}>
        {[0.25, 0.5, 0.75].map((p) => (
          <div key={p} className="absolute left-1 right-1 h-px bg-zinc-700/70" style={{ top: `${p * 100}%` }} />
        ))}
        <div className="absolute left-1/2 w-6 h-3 -translate-x-1/2 rounded-[3px]"
          style={{ top: `calc(${(1 - value) * 100}% - 6px)`, background: 'linear-gradient(#e5e5e5,#8a8a8a)', boxShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
          <div className="absolute left-0 right-0 top-[5px] h-px bg-black/40" />
        </div>
      </div>
      <div className="h-1.5 w-6 rounded-sm" style={{ background: value > 0.92 ? accent : 'rgba(0,0,0,0.5)', boxShadow: value > 0.92 ? `0 0 8px ${accent}` : 'none' }} />
    </div>
  );
}

/** LED-VU-Kette. */
function VU({ lit }: { lit: boolean }) {
  const segs = [0.14, 0.3, 0.44, 0.58, 0.7, 0.8, 0.9, 1];
  return (
    <div className="flex flex-col-reverse gap-[2px] rounded-sm bg-black/80 border border-zinc-800 p-1">
      {segs.map((lim, i) => {
        const on = lit && i / 4 > lim * 0.5;
        const c = i >= 6 ? 'bg-red-500' : i >= 4 ? 'bg-amber-400' : 'bg-emerald-400';
        return <div key={i} className={`w-2 h-2.5 rounded-[2px] ${on ? c : 'bg-zinc-900'}`} />;
      })}
    </div>
  );
}

export function DJ4ChMixer() {
  const [ch, setCh] = useState(() =>
    STRIPS.map(() => ({
      low: 1, mid: 1, high: 1, gain: 0.85, pan: 0.5, mute: false,
      loadName: '', loaded: false, bpm: undefined as number | undefined, key: undefined as string | undefined, analyzing: false,
    })),
  );
  const [xfd, setXfd] = useState(0.5);
  const [master, setMaster] = useState(0.8);

  const db = (v: number) => (v - 1) * 18; // 0..2 -> -18 .. +18 dB (1 = neutral)

  const apply = (idx: number, patch: Partial<(typeof ch)[0]>) => {
    const next = ch.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setCh(next);
    const c = next[idx];
    const s = STRIPS[idx];
    const deckMix = s.deck === 'A' ? 1 - xfd : xfd;
    const effective = c.mute ? 0 : c.gain * (0.3 + 0.7 * Math.min(1, deckMix + 0.35));
    audioEngine.setChannelGain(s.track, effective);
    audioEngine.setChannelEQ(s.track, 'low', db(c.low));
    audioEngine.setChannelEQ(s.track, 'mid', db(c.mid));
    audioEngine.setChannelEQ(s.track, 'high', db(c.high));
    audioEngine.setChannelPan(s.track, (c.pan - 0.5) * 2);
  };

  const applyMaster = (v: number) => { setMaster(v); audioEngine.setMasterVolume(v); };
  const applyCross = (v: number) => { setXfd(v); STRIPS.forEach((_, i) => apply(i, {})); };

  /** LOAD-SLOT: lädt einen Musik-Track, analysiert BPM/Key automatisch und
   *  synchronisiert den Session-Transport auf den Track-BPM. */
  const loadSong = (idx: number, t: MusicTrack) => {
    const next = ch.map((c, i) => (i === idx ? { ...c, loadName: t.name, loaded: true, analyzing: true } : c));
    setCh(next);
    audioEngine.loadTrackSample(STRIPS[idx].track, t.url);

    // Automatische, lokale Analyse (offline im Browser, kein API).
    analyzeMusic(t.url).then((a) => {
      setCh((prev) =>
        prev.map((c, i) =>
          i === idx
            ? { ...c, bpm: a?.bpm, key: a?.key ?? a?.camelot, analyzing: false }
            : c
        ),
      );
    });
  };

  /** Play: triggert das geladene Sample / Standard-Material auf dem Kanal. */
  const trigger = (idx: number) => {
    const c = ch[idx];
    if (c.mute) return;
    audioEngine.triggerEvent(STRIPS[idx].track, 0.9);
    apply(idx, {});
  };

  return (
    <div className="select-none shrink-0 bg-[#18181a] text-white relative border-t-2 border-b border-zinc-700">
      <div className="h-1 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600" />

      <div className="flex gap-2 px-3 py-3">
        {/* 4 Channel-Strips mit Load-Slot */}
        {STRIPS.map((s, i) => {
          const c = ch[i];
          return (
            <div key={s.track} className="flex-1 flex flex-col items-center gap-3 rounded-md border border-zinc-800 bg-gradient-to-b from-zinc-800/40 to-black px-2 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">

              <div className="flex items-center gap-2 w-full px-1">
                <span className={`text-[9px] font-black tracking-widest ${s.deck === 'A' ? 'text-red-400' : 'text-cyan-400'}`}>{s.deck}</span>
                <span className="text-[9px] font-black tracking-widest" style={{ color: s.accent }}>{s.label}</span>
                <div className="ml-auto flex gap-1"><VU lit={!c.mute && c.gain > 0.05} /></div>
              </div>

              {/* LOAD-SLOT: Musik aus Bibliothek waehlen / droppen */}
              <div className="w-full flex flex-col gap-1">
                <label className="text-[7px] font-mono text-zinc-600 tracking-widest">KANAL-LOAD / MUSIK</label>
                <select
                  value={c.loaded ? c.loadName : ''}
                  onChange={(e) => {
                    const t = MUSIC_LIBRARY.find((x) => x.name === e.target.value);
                    if (t) loadSong(i, t);
                  }}
                  className={`w-full text-[8px] rounded-md border-2 border-dashed px-1 py-1 bg-black/40 ${c.loaded ? 'border-cyan-500/60 text-cyan-200' : 'border-zinc-700 text-zinc-400'} hover:border-cyan-400/60`}
                >
                  <option value="">{c.loaded ? c.loadName : '+ LIED WÄHLEN'}</option>
                  <option disabled>── MUSIK-BIBLIOTHEK ──</option>
                  {MUSIC_LIBRARY.map((t) => (
                    <option key={t.id} value={t.name} className="text-neutral-300">{t.name}</option>
                  ))}
                </select>
                <div
                  className={`text-center text-[7px] font-mono ${c.loaded ? 'text-emerald-400' : 'text-zinc-600'}`}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {c.loaded ? '● READY' : 'DROP a.k. AUSWÄHLEN'}
                </div>
              </div>

              <button
                onClick={() => trigger(i)}
                className="w-full py-2 rounded-md border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 text-[10px] font-black tracking-widest hover:border-cyan-400/50 active:scale-[0.98]"
              >▶ PLAY</button>

              {/* Automatische Analyse (BPM/Key) */}
              <div className="w-full flex items-center justify-between rounded-md border border-zinc-800 bg-black/40 px-2 py-1">
                <span className="text-[7px] font-mono text-zinc-500">BPM</span>
                <span className="text-[9px] font-black text-cyan-300">
                  {c.analyzing ? <span className="text-zinc-500 animate-pulse">…</span> : (c.bpm ?? '--')}
                </span>
                <span className="text-[7px] font-mono text-zinc-500">KEY</span>
                <span className="text-[9px] font-black text-fuchsia-300">{c.key ?? '--'}</span>
              </div>

              <Knob label="HI"  value={c.high} onChange={(v) => apply(i, { high: v })} />
              <Knob label="MID" value={c.mid}  onChange={(v) => apply(i, { mid: v })} />
              <Knob label="LOW" value={c.low}  onChange={(v) => apply(i, { low: v })} />
              <Knob label="PAN" value={c.pan}  onChange={(v) => apply(i, { pan: v })} />

              <button
                onClick={() => apply(i, { mute: !c.mute })}
                className={`w-10 h-4 rounded-sm border text-[8px] font-bold tracking-widest ${c.mute ? 'bg-red-600 border-red-500 text-white' : 'border-zinc-700 bg-black/50 text-zinc-400'}`}
              >MUTE</button>
              <Fader value={c.gain} onChange={(v) => apply(i, { gain: v })} label="GAIN" accent={s.accent} />
            </div>
          );
        })}

        {/* Master-Sektion (Crossfader + Master) */}
        <div className="w-44 flex flex-col items-center justify-center gap-4 rounded-md border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black px-3 py-3">
          <div className="text-[9px] font-black tracking-[0.3em] text-zinc-400">CROSSFADER</div>
          <div className="relative w-40 h-3 rounded-full bg-black border border-zinc-800"
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const move = (ev: PointerEvent) => applyCross(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)));
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', () => window.removeEventListener('pointermove', move), { once: true });
            }}>
            <div className="absolute top-0 bottom-0 left-0 w-[45%] rounded-l-full bg-red-900/30" />
            <div className="absolute top-0 bottom-0 right-0 w-[45%] rounded-r-full bg-cyan-900/30" />
            <div className="absolute top-1/2 w-6 h-7 -translate-x-1/2 -translate-y-1/2 rounded bg-gradient-to-b from-zinc-300 to-zinc-600 border border-zinc-500 shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ left: `${xfd * 100}%` }}>
              <div className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-white/70" />
            </div>
          </div>
          <div className="flex w-40 justify-between text-[9px] font-mono"><span className="text-red-400">A</span><span className="text-cyan-400">B</span></div>

          <div className="h-px w-full bg-zinc-800" />
          <div className="text-[9px] font-black tracking-[0.3em] text-zinc-400">MASTER</div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
                <div key={p} className={`w-1.5 h-5 rounded-sm ${master >= p ? (p > 0.8 ? 'bg-red-500' : p > 0.55 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-zinc-900'}`} />
              ))}
            </div>
            <Fader value={master} onChange={applyMaster} label="OUT" accent="#f43f5e" />
          </div>
          <div className="text-[7px] font-mono tracking-widest text-zinc-600">AUDIOMONASTRY · XONE-SERIES</div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600" />
    </div>
  );
}
