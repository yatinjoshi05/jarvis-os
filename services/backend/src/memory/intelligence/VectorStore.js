// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — VectorStore
// Phase 2.2 — AI Memory Intelligence
//
// In-memory flat index backed by JSON persistence.
// Supports upsert, delete, and nearest-neighbour cosine search.
// Architecture: pluggable — swap this file for LanceDB/Chroma without
// touching any other service.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { cosineSimilarity } from './EmbeddingService.js';

const DEBOUNCE_MS = 500;

export class VectorStore {
  constructor(filePath) {
    this.filePath = filePath;
    /** @type {Map<string, Float32Array>} */
    this.index = new Map();
    this._saveTimer = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async load() {
    try {
      const raw = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      for (const [id, b64] of Object.entries(raw.vectors || {})) {
        const buf = Buffer.from(b64, 'base64');
        this.index.set(id, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
      }
      console.log(`[VectorStore] Loaded ${this.index.size} vectors from disk`);
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('[VectorStore] Load error:', err.message);
      // Start fresh — will be saved on first upsert
    }
  }

  async save() {
    const vectors = {};
    for (const [id, vec] of this.index) {
      const buf = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
      vectors[id] = buf.toString('base64');
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify({ vectors }, null, 2));
  }

  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save().catch(console.error), DEBOUNCE_MS);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Insert or update a vector.
   * @param {string} id
   * @param {Float32Array} vector
   */
  upsert(id, vector) {
    this.index.set(id, vector instanceof Float32Array ? vector : new Float32Array(vector));
    this._scheduleSave();
  }

  /**
   * Remove a vector by id.
   * @param {string} id
   */
  delete(id) {
    if (this.index.has(id)) {
      this.index.delete(id);
      this._scheduleSave();
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  /**
   * Nearest-neighbour cosine search.
   * @param {Float32Array} queryVector
   * @param {number} topK
   * @param {number} threshold  Minimum similarity to include (0–1)
   * @returns {Array<{ id: string, score: number }>}
   */
  search(queryVector, topK = 10, threshold = 0.1) {
    const results = [];
    for (const [id, vec] of this.index) {
      const score = cosineSimilarity(queryVector, vec);
      if (score >= threshold) results.push({ id, score });
    }
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get vector similarity between two stored memories.
   * @param {string} idA
   * @param {string} idB
   * @returns {number} cosine similarity 0–1
   */
  similarity(idA, idB) {
    const a = this.index.get(idA);
    const b = this.index.get(idB);
    return cosineSimilarity(a, b);
  }

  get size() { return this.index.size; }

  has(id) { return this.index.has(id); }
}
