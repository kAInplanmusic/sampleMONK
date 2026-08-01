import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { URL } from 'url';

dotenv.config();

const secretClient = new SecretManagerServiceClient();

async function getSecret(name: string) {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${name}/versions/latest`,
    });
    return version.payload?.data?.toString();
  } catch (e) {
    console.warn(`Secret ${name} not found in Secret Manager.`);
    return null;
  }
}

const PresetSchema = z.object({
  name: z.string(),
  genre: z.string(),
  bpm: z.number().min(110).max(145),
  key: z.string(),
  description: z.string(),
  patterns: z.object({
    kick: z.array(z.boolean()).length(16),
    hat: z.array(z.boolean()).length(16),
    clap: z.array(z.boolean()).length(16),
    synth: z.array(z.boolean()).length(16),
  }),
  synthNotes: z.array(z.number()).length(16),
  cutoff: z.number().min(300).max(1500),
  resonance: z.number().min(2).max(15),
  delayTime: z.union([z.literal(0.125), z.literal(0.25), z.literal(0.33), z.literal(0.5)]),
  decay: z.number().min(0.1).max(0.5),
});

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(express.json());

// --- Security: Firebase Auth middleware for API routes ---
import { getAuth } from 'firebase-admin/auth';

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

// --- Security: SSRF protection for URL fetching ---
const BLOCKED_HOSTS = [
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
];

function isUrlSafe(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block cloud metadata and loopback addresses
    if (BLOCKED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))) return false;
    // Block private/internal IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname)) return false;
    // Block link-local
    if (hostname.startsWith('169.254.')) return false;
    return true;
  } catch {
    return false;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Lazy-initialized Google Gen AI client
let aiClient: GoogleGenAI | null = null;

async function getAiClient(): Promise<GoogleGenAI> {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || await getSecret('GEMINI_API_KEY');
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable or secret is not defined on the server.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API: Generate a custom techno preset using Gemini AI
app.post('/api/generate-preset', requireAuth, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Please provide a prompt string.' });
  }

  try {
    const ai = await getAiClient();
    
    const systemPrompt = `You are a professional techno and electronic music producer. Your job is to convert user's text description into a fully detailed 16-step synthesizer and drum sequencer preset pattern in structured JSON.
    The response MUST be a single raw JSON object that conforms EXACTLY to this schema:
    {
      "name": "A short elegant creative name of the track/loop (e.g., 'Subterranean Deep')",
      "genre": "Exact techno subgenre (e.g., 'Dub Techno', 'Acid Techno', 'Detroit Techno')",
      "bpm": A number between 110 and 145,
      "key": "One of: 'C Minor (Acid)', 'A Minor Pentatonic', 'F# Phrygian'",
      "description": "A clean 1-sentence production description of this vibe.",
      "patterns": {
        "kick": [boolean array of size 16 representing 16th note triggers. Techno kick is usually on 0, 4, 8, 12, but feel free to vary slightly or add accent beats if requested],
        "hat": [boolean array of size 16 representing 16th note triggers. Hi-hats usually trigger on offbeats like 2, 6, 10, 14, or standard 16th note rolls],
        "clap": [boolean array of size 16 representing 16th note triggers. Claps are usually on 4 and 12],
        "synth": [boolean array of size 16 representing 16th note bass melody triggers]
      },
      "synthNotes": [array of exactly 16 numbers, each number is an index (0 to 7) corresponding to note pitch in the scale for that step],
      "cutoff": A frequency in Hz between 300 and 1500,
      "resonance": A resonance value between 2 and 15,
      "delayTime": A value for delay echo length: 0.125, 0.25, 0.33, or 0.5,
      "decay": A synth note decay value between 0.1 and 0.5
    }

    ONLY return this JSON. No backticks, no markdown, no explanatory text, no prefix. Start with '{' and end with '}'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate a techno preset based on this user mood/request: "${prompt}"`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        // Enforce JSON output format
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text?.trim() || '';
    
    // Safety check and JSON parsing
    try {
      const rawParsed = JSON.parse(responseText);
      const validatedPreset = PresetSchema.parse(rawParsed);
      return res.json(validatedPreset);
    } catch (parseError) {
      console.error('Failed to parse or validate Gemini response:', responseText, parseError);
      return res.status(500).json({ 
        error: 'The AI generated an invalid preset.',
        details: parseError instanceof z.ZodError ? parseError.issues : 'Parsing failed'
      });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Server failed to connect to Gemini API. Ensure GEMINI_API_KEY is configured in your secrets.' 
    });
  }
});

import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';
import unzipper from 'unzipper';

// Initialize Firebase Admin
let bucket: any = null;
let db: any = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'sample-monk.firebasestorage.app'
    });
    bucket = getStorage().bucket();
    db = getFirestore('ai-studio-samplemonk-66b72757-3896-4550-bc13-f8d649b1796c');
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT env var is missing. Zip importing to Firebase Storage will not work.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase Admin:", e);
}

// Global background task registry
const activeImportTasks: Record<string, { url: string; status: string; progress: string }> = {};


// API: HuggingFace Text-to-Audio (Placeholder for MusicGen / similar)
app.post('/api/huggingface/generate', requireAuth, async (req, res) => {
  try {
    const key = process.env.HUGGINGFACE_API_KEY || await getSecret('HUGGINGFACE_API_KEY');
    if (!key) {
      return res.status(500).json({ error: 'HUGGINGFACE_API_KEY is not defined in the environment or Secret Manager.' });
    }
    const { prompt } = req.body;
    
    // Example fetch to a Hugging Face Inference API (e.g. MusicGen)
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/musicgen-small',
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer'
      }
    );
    
    res.setHeader('Content-Type', 'audio/wav');
    return res.send(response.data);
  } catch (error: any) {
    console.error('HuggingFace API Error:', error?.message);
    return res.status(500).json({ error: 'Failed to generate audio via HuggingFace' });
  }
});

app.post('/api/import-zip', requireAuth, async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Please provide an array of URLs' });
  }
  // Validate all URLs before processing
  const unsafeUrls = urls.filter(u => typeof u !== 'string' || !isUrlSafe(u));
  if (unsafeUrls.length > 0) {
    return res.status(400).json({ error: 'One or more URLs are invalid or blocked (internal/private addresses are not allowed)' });
  }
  if (!bucket || !db) {
    return res.status(500).json({ error: 'Firebase Admin not configured. Please add FIREBASE_SERVICE_ACCOUNT to env vars.' });
  }

  const taskId = Date.now().toString();
  
  // Start background process
  processUrlsInBackground(taskId, urls);
  
  return res.json({ message: 'Import started in background', taskId });
});

app.get('/api/import-status/:taskId', requireAuth, (req, res) => {
  const taskId = req.params.taskId;
  return res.json({ status: activeImportTasks[taskId] || { status: 'unknown' } });
});

async function processUrlsInBackground(taskId: string, urls: string[]) {
  activeImportTasks[taskId] = { url: '', status: 'processing', progress: `0 / ${urls.length} files processed` };
  
  let totalProcessed = 0;
  for (const url of urls) {
    activeImportTasks[taskId].url = url;
    try {
      console.log(`Starting download for ${url}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      });

      const zipStream = response.data.pipe(unzipper.Parse({ forceStream: true }));
      
      for await (const entry of zipStream) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        
        if (type === 'File' && fileName.toLowerCase().endsWith('.wav')) {
          console.log(`Extracting and uploading: ${fileName}`);
          const fileRef = bucket.file(`samples/${Date.now()}_${path.basename(fileName)}`);
          
          // Stream directly from zip to Firebase Storage to avoid disk usage
          const writeStream = fileRef.createWriteStream({
            metadata: { contentType: 'audio/wav' }
          });
          
          await new Promise((resolve, reject) => {
            entry.pipe(writeStream)
              .on('finish', resolve)
              .on('error', reject);
          });
          
          await fileRef.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
          
          // Categorization logic
          let cat = 'mids';
          const lowerName = fileName.toLowerCase();
          if (lowerName.includes('kick') || lowerName.includes('bass') || lowerName.includes('sub')) cat = 'bass';
          else if (lowerName.includes('hat') || lowerName.includes('cymbal') || lowerName.includes('ride') || lowerName.includes('crash')) cat = 'highs';

          // Save metadata to Firestore
          try {
            await db.collection('samples').add({
              name: path.basename(fileName).replace('.wav', ''),
              url: publicUrl,
              category: cat,
              type: 'Cloud WAV Sample',
              createdAt: FieldValue.serverTimestamp()
            });
          } catch (dbAddErr) {
            console.error(`Failed to add ${fileName} to Firestore:`, dbAddErr);
          }
        } else {
          entry.autodrain(); // Skip non-wav files to prevent memory leak
        }
      }
      totalProcessed++;
      activeImportTasks[taskId].progress = `${totalProcessed} / ${urls.length} files processed`;
    } catch (error) {
      console.error(`Failed to process ${url}:`, error);
    }
  }
  
  activeImportTasks[taskId].status = 'completed';
}

app.get('/api/samples', requireAuth, async (req, res) => {
  try {
    const samples: any[] = [];
    
    // First, try loading cloud samples if DB is available
    if (db) {
      try {
        const snapshot = await db.collection('samples').orderBy('name', 'asc').limit(500).get();
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          samples.push({
            id: doc.id,
            name: data.name,
            category: data.category || 'mids',
            type: data.type || 'Cloud WAV Sample',
            url: data.url,
            description: 'Loaded from Firebase Storage',
            parameters: { frequency: data.category === 'bass' ? 60 : 1000, decay: 0.3 }
          });
        });
      } catch (dbError) {
        console.error("Firestore query failed, proceeding with local samples:", dbError);
      }
    }

    // Then, append local ones
    const samplesDir = path.join(process.cwd(), 'public', 'samples');
    if (fs.existsSync(samplesDir)) {
      const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.wav'));
      files.forEach((filename, idx) => {
        let cat = 'mids';
        const lowerName = filename.toLowerCase();
        if (lowerName.includes('kick') || lowerName.includes('bass') || lowerName.includes('sub')) cat = 'bass';
        else if (lowerName.includes('hat') || lowerName.includes('cymbal') || lowerName.includes('ride') || lowerName.includes('crash')) cat = 'highs';
        
        samples.push({
          id: `local-wav-${idx}`,
          name: filename.replace('.wav', ''),
          category: cat,
          type: 'Local WAV Sample',
          url: `/samples/${filename}`,
          description: 'Local WAV sample',
          parameters: { frequency: cat === 'bass' ? 60 : 1000, decay: 0.3 }
        });
      });
    }
    
    return res.json({ samples: samples });
  } catch (error) {
    console.error('Error listing samples:', error);
    return res.status(500).json({ error: 'Failed to list samples' });
  }
});

// Setup Vite Dev Server / Static Asset delivery
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tone Station server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
