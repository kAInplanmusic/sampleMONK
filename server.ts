import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Google Gen AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not defined on the server.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API: Generate a custom techno preset using Gemini AI
app.post('/api/generate-preset', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Please provide a prompt string.' });
  }

  try {
    const ai = getAiClient();
    
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
      const parsedPreset = JSON.parse(responseText);
      return res.json(parsedPreset);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText, parseError);
      return res.status(500).json({ 
        error: 'The AI generated a preset but it could not be processed as valid audio engine data. Please try again.',
        raw: responseText
      });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Server failed to connect to Gemini API. Ensure GEMINI_API_KEY is configured in your secrets.' 
    });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tone Station server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
