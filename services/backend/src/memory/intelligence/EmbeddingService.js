// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — EmbeddingService
// Phase 2.2 — AI Memory Intelligence
//
// Provider-agnostic embedding service.
// Primary:  OpenAI text-embedding-3-small (1536-dim)
// Fallback: TF-IDF bag-of-words cosine similarity (no API required)
// ─────────────────────────────────────────────────────────────────────────────

const EMBEDDING_DIM = 1536;
const LRU_MAX = 500;

// ── LRU Cache ────────────────────────────────────────────────────────────────
class LRUCache {
  constructor(max) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(key, val);
  }
  has(key) { return this.map.has(key); }
}

// ── TF-IDF Fallback ───────────────────────────────────────────────────────────
class TFIDFProvider {
  constructor() {
    this.vocab = new Map(); // word → index
    this.docFreq = new Map(); // word → number of docs containing it
    this.docCount = 0;
    this.dim = 512; // fixed dim for TF-IDF vectors
  }

  tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  updateVocab(tokens) {
    this.docCount++;
    const seen = new Set(tokens);
    for (const t of seen) {
      if (!this.vocab.has(t)) this.vocab.set(t, this.vocab.size);
      this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
    }
  }

  embed(text) {
    const tokens = this.tokenize(text);
    this.updateVocab(tokens);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1 / tokens.length);
    const vec = new Float32Array(this.dim);
    for (const [word, freq] of tf) {
      const idx = this.vocab.get(word);
      if (idx === undefined) continue;
      const df = this.docFreq.get(word) || 1;
      const idf = Math.log((this.docCount + 1) / (df + 1)) + 1;
      vec[idx % this.dim] += freq * idf;
    }
    return normalise(vec);
  }
}

// ── OpenAI Provider ───────────────────────────────────────────────────────────
class OpenAIEmbeddingProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = 'text-embedding-3-small';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async embed(text) {
    const input = String(text || '').slice(0, 8000); // token limit guard
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, input }),
    });
    if (!res.ok) throw new Error(`OpenAI Embeddings HTTP ${res.status}`);
    const data = await res.json();
    return new Float32Array(data.data[0].embedding);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalise(vec) {
  let mag = 0;
  for (const v of vec) mag += v * v;
  mag = Math.sqrt(mag);
  if (mag === 0) return vec;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / mag;
  return out;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.max(-1, Math.min(1, dot));
}

// ── EmbeddingService ──────────────────────────────────────────────────────────
export class EmbeddingService {
  constructor() {
    this.cache = new LRUCache(LRU_MAX);
    this.fallback = new TFIDFProvider();
    this.primary = null;
    this._initProvider();
  }

  _initProvider() {
    const key = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (key) {
      this.primary = new OpenAIEmbeddingProvider(key);
      console.log('[EmbeddingService] Provider: OpenAI text-embedding-3-small');
    } else {
      console.log('[EmbeddingService] Provider: TF-IDF fallback (no OpenAI key)');
    }
  }

  /**
   * Embed a text string.
   * Returns a normalised Float32Array.
   */
  async embed(text) {
    const cacheKey = text.slice(0, 200);
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    let vec;
    if (this.primary) {
      try {
        vec = await this.primary.embed(text);
      } catch (err) {
        console.warn('[EmbeddingService] Primary failed, using TF-IDF fallback:', err.message);
        vec = this.fallback.embed(text);
      }
    } else {
      vec = this.fallback.embed(text);
    }

    vec = normalise(vec);
    this.cache.set(cacheKey, vec);
    return vec;
  }

  /**
   * Embed a memory entry using title + content + tags
   */
  async embedMemory(memory) {
    const text = [
      memory.title,
      memory.content,
      memory.summary,
      ...(memory.tags || []),
    ].filter(Boolean).join(' ');
    return this.embed(text);
  }

  get dimension() {
    return this.primary ? EMBEDDING_DIM : this.fallback.dim;
  }
}
