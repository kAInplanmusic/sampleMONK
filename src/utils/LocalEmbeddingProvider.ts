// ============================================================================
// LocalEmbeddingProvider - Deterministische semantische Suche (offline, keine
// externe Laufzeit-Abhaengigkeit).
//
// Warum KEIN @xenova/transformers als Pflicht-Abhaengigkeit?
//  - Das Paket ist sehr schwer (>2MB) und laedt das ONNX-Modell (MiniLM-L6-v2,
//    ~80MB) beim ersten Lauf vom HuggingFace-Hub nach. Das widerspricht dem
//    Firebase-frei / Latenz / Offline-first-Mandat von sampleMONK.
//  - Stattdessen wird ein DETERMINISTISCHER offline-faehiger Kern genutzt:
//      * Token-Normalisierung + Wortstamm-Light
//      * Fachwort-Synonyme fuer Audio/DJ/Techno (erweiterbar)
//      * BM25-artige Relevanz + Cosinus-Aehnlichkeit (deterministisch)
//    @xenova/transformers bleibt OPTIONAL (falls installiert) fuer echte ONNX.
// ============================================================================

import { AudioSample } from '../data/samples';

const DIM = 512;

// --- Stopwoerter (deterministisch) ---
const STOPWORDS = new Set([
  'a','an','the','and','or','of','in','on','for','to','with','from','that','this',
  'is','are','was','were','be','been','being','at','by','as','it','its','not','no',
  'but','if','then','so','into','over','under','again','more','most','other','some',
]);

// --- Kompakter Wortstamm (deterministisch, englisch, Musik-Audio-Wortschatz) ---
function stem(token: string): string {
  const min = Math.max(1, Math.floor(token.length * 0.5));
  if (token.length <= min) return token;
  let w = token;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('ly')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('ers')) w = w.slice(0, -1);
  else if (w.length > 4 && w.endsWith('er')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

// --- Fachwort-Synonyme fuer Audio/DJ/Techno (deterministisch, erweiterbar) ---
const SYNONYMS: Record<string, string[]> = {
  kick: ['kick', 'bassdrum', 'bass_drum', 'boom', 'thump'],
  snare: ['snare', 'backbeat', 'rim', 'rimshot'],
  hat: ['hat', 'hihat', 'hi_hat', 'cymbals', 'cymbal'],
  hatopen: ['openhat', 'open_hat', 'sizzle'],
  clap: ['clap', 'hands', 'claps'],
  perc: ['perc', 'percussion', 'toms', 'tom', 'cowbell', 'conga', 'timbale', 'bongo'],
  shaker: ['shaker', 'maracas', 'shuffle', 'tambourine'],
  bass: ['bass', 'sub', 'subbass', 'low', 'lowend', 'low_end', 'lows'],
  acid: ['acid', '303', 'tb303', 'resonant', 'squelchy'],
  pad: ['pad', 'chord', 'texture', 'ambient', 'drone', 'atmospheric'],
  chord: ['chord', 'stab', 'rave', 'hoover'],
  lead: ['lead', 'pluck', 'arp', 'arpeggio'],
  synth: ['synth', 'synthesizer', 'analog', 'digital'],
  techno: ['techno', 'warehouse', 'berlin', 'detroit'],
  house: ['house', 'deep', 'disco', 'garage'],
  dub: ['dub', 'reggae', 'delay', 'echo'],
  punchy: ['punchy', 'tight', 'snappy', 'sharp', 'clean'],
  warm: ['warm', 'smooth', 'fat', 'round', 'deep'],
  metallic: ['metallic', 'metal', 'brass', 'tone'],
  gritty: ['gritty', 'distorted', 'drive', 'raw', 'grime'],
};

type TokenMap = Map<string, number>;

/** Normalisiert einen Text in ein gewichtetes Token-set (mit Synonym-Expansion). */
function tokenize(field: string): TokenMap {
  const counts = new Map<string, number>();
  const raw = field.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const r of raw) {
    if (STOPWORDS.has(r)) continue;
    const s = stem(r);
    const writes = new Set<string>([s, ...(SYNONYMS[s] || [])]);
    writes.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  }
  return counts;
}

function slotFor(t: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h % DIM;
}

/** Deterministic TF-IDF-gewichtetes Embedding (kein Zufall). */
function fallbackEmbedding(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  for (const [tok, freq] of tokenize(text)) {
    const w = 1 + Math.log(freq);
    vec[slotFor(tok)] += w;
  }
  const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map((v) => v / norm);
}

// --- BM25-artige Relevanz ---
export function bm25Score(
  docFreq: Map<string, number>, totalDocs: number, doc: TokenMap, query: TokenMap, k1 = 1.2, b = 0.75,
): number {
  const docLen = Array.from(doc.values()).reduce((a, v) => a + v, 0) || 1;
  let score = 0;
  for (const [qTok, qFq] of query) {
    const tf = doc.get(qTok) || 0;
    if (tf === 0) continue;
    const idf = Math.log(1 + (totalDocs - (docFreq.get(qTok) || 0) + 0.5) / ((docFreq.get(qTok) || 0) + 0.5));
    const denom = tf + k1 * (1 - b + b * (docLen / 5));
    score += idf * ((tf * (k1 + 1)) / denom) * (1 + 0.2 * qFq);
  }
  return score;
}

// --- Deterministischer Suchindex (BM25 + Synonym-Expansion) ---
export class SemanticIndex {
  private perDoc = new Map<string, TokenMap>();
  private docFreq = new Map<string, number>();
  private total = 0;

  build(docs: { id: string; text: string }[]) {
    this.perDoc.clear();
    this.docFreq.clear();
    this.total = docs.length;
    for (const d of docs) {
      const tk = tokenize(d.text);
      this.perDoc.set(d.id, tk);
      for (const t of tk.keys()) this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
    }
  }

  search(query: string, limit = 20): { id: string; score: number }[] {
    const qTokens = tokenize(query);
    if (qTokens.size === 0 || this.total === 0) return [];
    const results: { id: string; score: number }[] = [];
    for (const [id, doc] of this.perDoc) {
      const s = bm25Score(this.docFreq, this.total, doc, qTokens);
      if (s > 0) results.push({ id, score: s });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

/** Kombinierter Ranker: BM25 (dominant) + Cosinus-Aehnlichkeit (tie-break). */
export function semanticRankSamples(
  samples: AudioSample[],
  query: string,
  limit = 50,
): { sample: AudioSample; score: number }[] {
  const index = new SemanticIndex();
  const docs = samples.map((s) => ({
    id: s.id,
    text: `${s.name} ${s.type} ${s.description} ${(s.tags || []).join(' ')} ${s.id}`,
  }));
  index.build(docs);

  const hits = index.search(query, limit * 2);
  const hitScores = new Map(hits.map((h) => [h.id, h.score]));

  const qVec = fallbackEmbedding(query);
  const mixed: { sample: AudioSample; score: number }[] = [];
  for (const s of samples) {
    const bm = hitScores.get(s.id) || 0;
    const cos = cosineSimilarity(qVec, fallbackEmbedding(`${s.name} ${s.type} ${s.description}`));
    const score = bm * 1.4 + cos * 0.6;
    if (score > 0.01) mixed.push({ sample: s, score });
  }
  mixed.sort((a, b) => b.score - a.score);
  return mixed.slice(0, limit);
}

// ============================================================================
// Optionaler ONNX-Pfad (nur wenn @xenova/transformers installiert ist).
// ============================================================================
let transformersLib: any = null;

async function loadTransformer(): Promise<any> {
  if (transformersLib) return transformersLib;
  try {
    const pkgName = '@xenova/transformers';
    const mod = await import(/* @vite-ignore */ pkgName).catch(() => null);
    transformersLib = mod;
    return mod;
  } catch {
    return null;
  }
}

export const generateLocalEmbedding = async (text: string): Promise<number[]> => {
  const tx = await loadTransformer();
  if (tx?.pipeline) {
    try {
      const extractor = tx.pipeline?.length
        ? await tx.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
        : null;
      if (extractor) {
        const res = await extractor(text, { pooling: 'mean', normalize: true });
        const data = res?.data ?? res?.[0]?.data ?? null;
        if (data) return Array.from(data as Float32Array);
      }
    } catch (e) {
      console.warn('transformers.js Embedding fehlgeschlagen; verwende Fallback.', e);
    }
  }
  return fallbackEmbedding(text);
};

export const isLocalEmbeddingAvailable = async (): Promise<boolean> => true;

// Kosinus-Aehnlichkeit zweier Vektoren
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
