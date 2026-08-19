import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Task 14: Echte Demucs-Stems optional via env-Flag ENABLE_STEMS=1 aktivieren.
const ENABLE_STEMS = (process.env.ENABLE_STEMS || '').trim() === '1';

/**
 * audioMONASTRY Server – VENDOR-/CLOUD-FREI.
 *
 * Diese Datei enthaelt KEINERLEI Verbindung zu externen Cloud-Anbietern.
 * Storage, Secret Manager oder GenAI. Der gesamte Stack (static
 * App + REST-API + WebRTC-Signaling) laeuft in einem Node-Prozess.
 *
 * Fuer Hetzner:  PORT=8080, NODE_ENV=production, `node dist/server.cjs`
 */

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(express.json());

// --- Security: Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ===========================================================================
// Lokale, cloud-freie Endpunkte
// Diese Endpunkte halten die Frontend-Funktionen (KI-Komposition, Stems,
// Voice) am Laufen, ohne externe Cloud-Anbieter zu nutzen.
//
// Hinweis: Falls spaeter ein echter Backend-Service (z.B. services/backend-core
// mit eigenem Host) betrieben wird, kann hier ein Proxy eingebaut werden.
// ===========================================================================

// --- POST /api/ai/compose  → deterministischer lokaler Preset-Generator ---
app.post('/api/ai/compose', async (req, res) => {
  const { prompt } = (req.body ?? {}) as { prompt?: string };
  const seed = (prompt || 'techno').length;

  // Deterministische Patterns aus dem Prompt-Seed ableiten (kein Netz).
  const kick = Array.from({ length: 16 }, (_, i) => (i + seed) % 4 === 0);
  const hat = Array.from({ length: 16 }, (_, i) => (i + seed) % 2 === 1);
  const clap = Array.from({ length: 16 }, (_, i) => i === 4 || i === 12);
  const synth = Array.from({ length: 16 }, (_, i) => (i + seed * 2) % 3 === 0);

  const synthNotes = Array.from({ length: 16 }, (_, i) => (i + seed) % 8);
  const bpm = 110 + (seed % 36); // 110–145

  return res.json({
    task_id: 'local_' + Date.now(),
    patterns: { kick, hat, clap, synth },
    synthNotes,
    bpm,
    genre: 'Local Techno',
  });
});


// ---------------------------------------------------------------------------
// POST /api/ai/generate + /api/ai/describe  → Ollama (lokal, self-hosted)
// ---------------------------------------------------------------------------
// Verdrahtet HyperSonicMOA-artige Anfragen an ein lokales Ollama-Modell.
// Nutzt node>=18 global fetch; bei Fehler fällt es auf den deterministischen
// lokalen Generator zurück (kein Cloud-Aufruf). Konfiguration via env:
//   OLLAMA_URL    (Default http://127.0.0.1:11434)
//   OLLAMA_MODEL  (Default qwen2.5:7b)
// ---------------------------------------------------------------------------

async function ollamaGenerate(promptText: string): Promise<string | null> {
  const url = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  try {
    const resp = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: promptText, stream: false, options: { temperature: 0.7 } }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { response?: string };
    return data.response ?? null;
  } catch (e) {
    console.warn('[ollama] nicht erreichbar:', (e as Error).message);
    return null;
  }
}

function sanitizeJsonBlock(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  if (s.endsWith('```')) s = s.slice(0, -3);
  return s.trim();
}

// --- POST /api/ai/compose  → Ollama-gestützte KI-Komposition (mit lokalem Fallback) ---
app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = (req.body ?? {}) as { prompt?: string };
  const query = (prompt || 'Dark warehouse techno drums').trim();

  const llmPrompt =
    'Generiere ein valides JSON (nur JSON, keine Erklärung) mit Feldern ' +
    '{ bpm: number, genre: string, patterns: { kick:boolean[16], hat:boolean[16], clap:boolean[16], synth:boolean[16] }, synthNotes:number[16] } ' +
    'für einen Techno-Track basierend auf dem Prompt: "' + query + '".';

  const raw = await ollamaGenerate(llmPrompt);
  if (raw) {
    try {
      const parsed = JSON.parse(sanitizeJsonBlock(raw));
      return res.json({ task_id: 'ollama_' + Date.now(), source: 'ollama', ...parsed });
    } catch (e) {
      console.warn('[ollama] ungültiges JSON, Fallback.', e);
    }
  }

  // Deterministischer lokaler Fallback (kein Netz).
  const seed = query.length;
  const kick = Array.from({ length: 16 }, (_, i) => (i + seed) % 4 === 0);
  const hat = Array.from({ length: 16 }, (_, i) => (i + seed) % 2 === 1);
  const clap = Array.from({ length: 16 }, (_, i) => i === 4 || i === 12);
  const synth = Array.from({ length: 16 }, (_, i) => (i + seed * 2) % 3 === 0);
  const synthNotes = Array.from({ length: 16 }, (_, i) => (i + seed) % 8);
  return res.json({
    task_id: 'local_' + Date.now(), source: 'local',
    patterns: { kick, hat, clap, synth }, synthNotes,
    bpm: 110 + (seed % 36), genre: 'Local Techno',
  });
});

// --- POST /api/ai/describe  → Ollama-gestützte Beschreibung (Style/Mix-Empfehlung) ---
app.post('/api/ai/describe', async (req, res) => {
  const { prompt } = (req.body ?? {}) as { prompt?: string };
  const query = (prompt || 'Was ist ein guter Mix-Vorschlag ?').trim();

  const llmPrompt =
    'Beantworte kurz (max 2 Sätze), auf Deutsch, fachlich für einen Musik-Produzenten: ' + query;

  const raw = await ollamaGenerate(llmPrompt);
  if (raw) {
    return res.json({ ai: raw.trim() });
  }
  return res.json({ ai: 'Ollama nicht erreichbar. (Lokaler Fallback: keine KI-Antwort verfügbar)' });
});

// --- POST /api/separate-stems  → lokaler Stems-Stub (SSE mit Fortschritt) ---
// P11: Proxy zum separaten stem-ai (FastAPI/Demucs) Container, falls aktiviert.
const STEM_AI_URL = (process.env.STEM_AI_URL || '').trim() || 'http://stem-ai:8000';

app.post('/api/separate-stems', async (req, res) => {
  const stemAiActive = ENABLE_STEMS && !!(process.env.STEM_AI_URL);

  // FormData-Upload (Vite-Frontend/streamStems sendet multipart) -> stem-ai.
  if (stemAiActive && req.is('multipart/form-data')) {
    try {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve) => {
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => resolve());
      });
      const raw = Buffer.concat(chunks);
      const ct = (req.headers['content-type'] || '') as string;
      const boundary = ct.match(/boundary=(.+)$/)?.[1] as string | undefined;
      if (!boundary) throw new Error('multipart boundary fehlt');

      const fd = new FormData();
      const parts = raw.toString('latin1').split('--' + boundary);
      for (const p of parts) {
        if (!p.trim()) continue;
        const sep = p.indexOf('\r\n\r\n');
        if (sep < 0) continue;
        const header = p.slice(0, sep);
        const body = p.slice(sep + 4).replace(/\r\n$/, '');
        const nameMatch = header.match(/name="([^"]+)"/);
        if (!nameMatch) continue;
        const filenameMatch = header.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          const buf = Buffer.from(body, 'latin1');
          fd.append(nameMatch[1], new Blob([buf]), filenameMatch[1]);
        } else {
          fd.append(nameMatch[1], body);
        }
      }

      const resp = await fetch(STEM_AI_URL + '/separate-stems', { method: 'POST', body: fd });
      const data = await resp.json() as any;
      res.status(resp.status).json(data);
      return;
    } catch (e) {
      res.status(502).json({ status: 'error', message: 'stem-ai Proxy fehlgeschlagen: ' + ((e as Error).message ?? '') });
      return;
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Fallback: simulierte 4-Stem-Aufteilung (Stub) mit Fortschritt
  let p = 0;
  const timer = setInterval(() => {
    p += 20;
    res.write(`data: ${JSON.stringify({ progress: p })}\n\n`);
    if (p >= 100) {
      clearInterval(timer);
      res.write(`data: ${JSON.stringify({
        status: 'success',
        stems: {
          vocals: '', melody: '', highs: '', mids: '', lows: '',
        },
      })}\n\n`);
      res.end();
    }
  }, 300);
});

// --- POST /api/generate-voice  → lokaler Voice-Stub ---
app.post('/api/generate-voice', async (req, res) => {
  const { text, voicePreset } = (req.body ?? {}) as { text?: string; voicePreset?: string };
  const query = (text ?? '').trim();
  const preset = (voicePreset ?? 'FEMALE_ROBOTIC').trim();

  // Falls ein lokaler RVC/VITS-Synthesizer per env aktiviert ist und das CLI
  // existiert, wird dieser bevorzugt. Konfiguration:
  //   VOICE_ENGINE=rvc|vits   VOICE_CLI=/pfad/zu/predict (optional)
  const engine = (process.env.VOICE_ENGINE || '').trim().toLowerCase();
  const voiceCli = (process.env.VOICE_CLI || '').trim();
  if (engine && voiceCli && query) {
    try {
      const { execFile } = require('child_process');
      const audioUrl = await new Promise<string>((resolve, reject) => {
        const stamp = Date.now();
        const outFile = `dist/voices/voice_${stamp}.wav`;
        const args = ['--input', query, '--output', outFile, '--preset', preset];
        execFile(voiceCli, args, { timeout: 45000 }, (err: Error | null) => {
          if (err) return reject(err);
          resolve(`/voices/voice_${stamp}.wav`);
        });
      });
      return res.json({ status: 'ok', url: audioUrl, text: query, voicePreset: preset });
    } catch (e) {
      console.warn('[voice] lokaler Engine-Fehler, Fallback auf Web-Speech.', (e as Error).message);
    }
  }

  // Kein lokaler Engine-CLI: hinterlasse status 'local', das Frontend nutzt dann
  // Web-Speech-Synthese (kein Cloud-TTS, keine Server-Cloudabhängigkeit).
  return res.json({
    status: 'local',
    url: '',
    text: query,
    voicePreset: preset,
    hint: 'Web-Speech (browser) verwenden',
  });
});

// ===========================================================================
// Static Asset delivery (Vite dev / production dist)
// ===========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Dev-Fix: Die AudioWorklet-Dateien werden von build-worklets.mjs nach
    // `public/worklets` (für Vite Dev) UND `dist/worklets` (für Prod) gebaut.
    // Wir servieren /worklets EXPLIZIT VOR vite.middlewares, damit /worklets/*.js
    // echtes JS bekommt und NICHT vom Vite-SPA-Fallback als index.html geliefert
    // wird (sonst: addModule -> 'SyntaxError: expected expression, got <').
    const workletsDirs = [
      path.join(process.cwd(), 'public/worklets'),
      path.join(process.cwd(), 'dist/worklets'),
    ];
    for (const dir of workletsDirs) {
      app.use('/worklets', express.static(dir, {
        setHeaders: (res, p) => {
          if (p.endsWith('.js') || p.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
        },
      }));
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, p) => {
        if (p.endsWith('.js') || p.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        if (p.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // --- WebRTC Socket.io signaling (same origin as the app) ---
  const IDLE_TIMEOUT_MS = Number(process.env.SIGNALING_IDLE_TIMEOUT_MS || 20 * 60 * 1000);
  const ALLOWED_ORIGINS = process.env.SIGNALING_ALLOWED_ORIGINS
    ? process.env.SIGNALING_ALLOWED_ORIGINS.split(',')
    : [];

  try {
    const { Server } = (await import('socket.io')) as any;
    const io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : false,
        methods: ['GET', 'POST'],
      },
      path: '/webrtc-signaling',
    });

    io.on('connection', (socket: any) => {
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      const refreshIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => socket.disconnect(true), IDLE_TIMEOUT_MS);
      };
      refreshIdleTimer();

      socket.on('offer', (data: any) => {
        refreshIdleTimer();
        if (!data.target || !data.offer) return;
        socket.to(data.target).emit('offer', { offer: data.offer, sender: socket.id });
      });
      socket.on('answer', (data: any) => {
        refreshIdleTimer();
        if (!data.target || !data.answer) return;
        socket.to(data.target).emit('answer', { answer: data.answer, sender: socket.id });
      });
      socket.on('ice-candidate', (data: any) => {
        refreshIdleTimer();
        if (!data.target || !data.candidate) return;
        socket.to(data.target).emit('ice-candidate', { candidate: data.candidate, sender: socket.id });
      });
      socket.on('activity', refreshIdleTimer);
    });
  } catch (e) {
    console.warn('Socket.io signaling disabled:', (e as Error).message);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`audioMONASTRY (cloud-frei) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
