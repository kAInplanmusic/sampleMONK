import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';

// Task 14: Echte Demucs-Stems optional via env-Flag ENABLE_STEMS=1 aktivieren.
const ENABLE_STEMS = (process.env.ENABLE_STEMS || '').trim() === '1';

/**
 * sampleMONK Server – GOOGLE/FIRESTORE-ENTKOPPELT.
 *
 * Diese Datei enthaelt KEINERLEI Verbindung zu Google Firebase, Firestore,
 * Google Storage, Secret Manager oder Google GenAI. Der gesamte Stack (static
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
// Lokale, Google-freie Endpunkte
// Diese Endpunkte halten die Frontend-Funktionen (KI-Komposition, Stems,
// Voice) am Laufen, ohne sich zu Google/Firebase zu verbinden.
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

// --- POST /api/separate-stems  → lokaler Stems-Stub (SSE mit Fortschritt) ---
app.post('/api/separate-stems', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { file } = (req.body ?? {}) as { file?: string };

  if (ENABLE_STEMS && file) {
    // Echte Demucs-Inferenz (Python CLI, PyTorch + torchaudio erforderlich).
    const proc = spawn('demucs', ['--two-stems', 'vocals', '--out', './dist/stems', file], {
      shell: false,
    });
    proc.stdout.on('data', (d) => res.write(`data: ${JSON.stringify({ log: String(d) })}\n\n`));
    proc.stderr.on('data', (d) => res.write(`data: ${JSON.stringify({ log: String(d) })}\n\n`));
    proc.on('close', (code) => {
      const ok = code === 0;
      res.write(`data: ${JSON.stringify({
        status: ok ? 'success' : 'error',
        code,
        stems: {
          vocals: ok ? '../../dist/stems/vocals.wav' : '',
          melody: '', highs: '', mids: '', lows: '',
        },
      })}\n\n`);
      res.end();
    });
    proc.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ status: 'error', message: `Demucs nicht verfügbar: ${err.message}` })}\n\n`);
      res.end();
    });
    return;
  }

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
  // Lokaler No-Op: liefert einen Platzhalter zurueck (kein Google TTS).
  return res.json({
    status: 'local',
    url: '',
    text: text ?? '',
    voicePreset: voicePreset ?? 'default',
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
    app.use(vite.middlewares);

    // Dev-Fix: Die AudioWorklet-Dateien werden nach `dist/worklets` gebaut
    // (build-worklets.mjs) und müssen auch im Dev-Modus unter `/worklets/…`
    // serviert werden – sonst liefert der Vite-SPA-Fallback index.html.
    // Vite Dev serviert `public/` als Root; wir registrieren zusätzlich die
    // gebaute Worklet-Ablage, damit addModule(url) echtes JS erhält.
    const workletsDist = path.join(process.cwd(), 'dist/worklets');
    app.use('/worklets', express.static(workletsDist, {
      setHeaders: (res, p) => {
        if (p.endsWith('.js') || p.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));
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
    app.get('*', (req, res) => {
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
    console.log(`sampleMONK (Google-frei) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
