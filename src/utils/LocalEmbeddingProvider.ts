// ============================================================================
// Task 19: Echte lokale Embeddings (biblioMONK semantische Suche)
// ----------------------------------------------------------------------------
// Nutzt bevorzugt @xenova/transformers (MiniLM-L6-v2) für echte semantische
// Vektoren. Wenn das Paket nicht installiert ist, fällt es auf einen DETERMINI-
// STISCHEN feature-hash-basierten 512-d-Embedding-Fallback zurück (kein Zufall),
// sodass Kollationen/Konsequenz in Metadaten-Suche erhalten bleiben.
// ============================================================================

const DIM = 512;

// --- Deterministischer Mini-Hash-Fallback (ohne externe Abhängigkeit) ---
function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fallbackEmbedding(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9äöüß]+/).filter(Boolean);
  tokens.forEach((tok, idx) => {
    const h = hash32(tok);
    const slot = h % DIM;
    // additiv mit Dokument- und Position-Signatur (Signierung)
    const sign = ((h >>> 8) & 1) === 0 ? 1 : -1;
    vec[slot] += sign * (1 + (idx % 5) * 0.2);
  });
  // L2-Normalisierung
  const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / norm);
}

let transformersLib: any = null;

async function loadTransformer(): Promise<any> {
  if (transformersLib) return transformersLib;
  try {
    // @xenova/transformers (pip-äquivalent zu @huggingface/transformers-onnx)
    const mod = await import('@xenova/transformers');
    transformersLib = mod;
    return mod;
  } catch {
    return null;
  }
}

export const generateLocalEmbedding = async (text: string): Promise<number[]> => {
  // Echte ONNX-basierte semantische Embeddings, falls verfügbar
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
  // Deterministischer Hash-Fallback (kein Zufall)
  return fallbackEmbedding(text);
};

export const isLocalEmbeddingAvailable = async (): Promise<boolean> => {
  const tx = await loadTransformer();
  if (tx) return true;
  return process.env.VITE_ENABLE_LOCAL_EMBEDDINGS === 'true';
};

// Kosinus-Ähnlichkeit zweier Vektoren
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
