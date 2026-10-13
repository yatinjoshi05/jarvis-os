import fs from 'node:fs/promises';
import path from 'node:path';

export class MemoryRepository {
  constructor(file) {
    this.file = file;
    this.data = {
      memories: {},
      relationships: [],
      summaries: {},    // { [memoryId]: AISummary }
      insights: [],     // MemoryInsight[]
    };
  }

  async load() {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8'));
      this.data = {
        memories: parsed.memories || {},
        relationships: parsed.relationships || [],
        summaries: parsed.summaries || {},
        insights: parsed.insights || [],
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.save();
    }
  }

  async save() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.data, null, 2));
  }

  // ── Memory CRUD ───────────────────────────────────────────────────────────
  list() { return Object.values(this.data.memories); }
  get(id) { return this.data.memories[id] || null; }
  async put(memory) { this.data.memories[memory.id] = memory; await this.save(); return memory; }
  async remove(id) {
    delete this.data.memories[id];
    this.data.relationships = this.data.relationships.filter(e => e.from !== id && e.to !== id);
    delete this.data.summaries[id];
    await this.save();
  }
  async relate(edge) { this.data.relationships.push(edge); await this.save(); return edge; }

  // ── Summary store ─────────────────────────────────────────────────────────
  getSummary(memoryId) { return this.data.summaries[memoryId] || null; }
  async putSummary(memoryId, summary) {
    this.data.summaries[memoryId] = summary;
    await this.save();
    return summary;
  }

  // ── Insights store ────────────────────────────────────────────────────────
  getInsights() { return this.data.insights || []; }
  async putInsights(insights) {
    this.data.insights = insights;
    await this.save();
  }
}
