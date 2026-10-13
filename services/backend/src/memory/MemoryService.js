// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryService (Phase 2.2 extended)
// Core CRUD operations + intelligence lifecycle hooks
// ─────────────────────────────────────────────────────────────────────────────

const categories = new Set(['Personal', 'Projects', 'Coding', 'Browser', 'CRM', 'Finance', 'Voice', 'Automation', 'System', 'Files', 'Images', 'Custom']);
const now = () => new Date().toISOString();
const words = text => new Set(String(text || '').toLowerCase().match(/[a-z0-9_]{2,}/g) || []);

export class MemoryService {
  constructor(repository, events) {
    this.repository = repository;
    this.events = events;
    /** @type {import('./intelligence/MemoryIntelligenceService.js').MemoryIntelligenceService | null} */
    this.intelligence = null; // injected after construction
  }

  /** Called by server.js after MemoryIntelligenceService is constructed */
  setIntelligence(intelligenceService) {
    this.intelligence = intelligenceService;
  }

  async create(input) {
    if (!input?.title?.trim() || !input?.content?.trim())
      throw Object.assign(new Error('Memory title and content are required.'), { status: 400 });

    const timestamp = now();
    const memory = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      content: input.content.trim(),
      summary: input.summary || input.content.slice(0, 500),
      category: categories.has(input.category) ? input.category : 'Custom',
      source: input.source || 'runtime',
      importance: Math.max(0, Math.min(1, Number(input.importance ?? 0.5))),
      confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 1))),
      tags: [...new Set(input.tags || [])],
      references: input.references || [],
      relationships: [],
      private: Boolean(input.private),
      pinned: false,
      archived: false,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: input.expiresAt || null,
      accessCount: 0,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    // Deduplicate via keyword search
    const duplicate = (await this.search({ query: memory.content, limit: 1 }))
      .find(result => result.score > 0.92);
    if (duplicate) return this.update(duplicate.memory.id, { ...input, content: memory.content, title: memory.title });

    await this.repository.put(memory);
    this.event('MemoryCreated', memory);

    // Intelligence hook — async, non-blocking
    if (this.intelligence) {
      this.intelligence.onMemoryCreated(memory).catch(err =>
        console.warn('[MemoryService] Intelligence hook failed on create:', err.message)
      );
    }

    return memory;
  }

  async update(id, patch) {
    const memory = this.require(id);
    Object.assign(memory, patch, { id, updatedAt: now(), version: memory.version + 1 });
    await this.repository.put(memory);
    this.event('MemoryUpdated', memory);

    // Intelligence hook — async, non-blocking
    if (this.intelligence) {
      this.intelligence.onMemoryUpdated(memory).catch(err =>
        console.warn('[MemoryService] Intelligence hook failed on update:', err.message)
      );
    }

    return memory;
  }

  async delete(id) {
    const memory = this.require(id);
    await this.repository.remove(id);
    this.event('MemoryDeleted', memory);

    // Intelligence hook — synchronous (just removes from indexes)
    if (this.intelligence) {
      this.intelligence.onMemoryDeleted(id);
    }
  }

  async archive(id, archived = true) {
    const memory = await this.update(id, { archived });
    this.event(archived ? 'MemoryArchived' : 'MemoryRestored', memory);
    return memory;
  }

  async pin(id, pinned = true) {
    const memory = await this.update(id, { pinned });
    this.event(pinned ? 'MemoryPinned' : 'MemoryUnpinned', memory);
    return memory;
  }

  async merge(primaryId, secondaryId) {
    const primary = this.require(primaryId);
    const secondary = this.require(secondaryId);
    const merged = await this.update(primaryId, {
      content: `${primary.content}\n\n${secondary.content}`,
      tags: [...new Set([...primary.tags, ...secondary.tags])],
      references: [...new Set([...primary.references, ...secondary.references])],
    });
    await this.delete(secondaryId);
    this.event('MemoryMerged', merged);
    return merged;
  }

  /** Keyword-based search (legacy + fallback). Semantic search is in MemoryIntelligenceService. */
  async search(query = {}) {
    const terms = words(query.query);
    const timestamp = Date.now();
    const results = this.repository.list()
      .filter(memory =>
        !memory.archived &&
        (!memory.expiresAt || Date.parse(memory.expiresAt) > timestamp) &&
        (!query.category || memory.category === query.category) &&
        (!query.tag || memory.tags.includes(query.tag))
      )
      .map(memory => {
        const corpus = words(`${memory.title} ${memory.content} ${memory.summary} ${memory.tags.join(' ')}`);
        const relevance = terms.size
          ? [...terms].filter(term => corpus.has(term)).length / terms.size
          : 0;
        const recency = Math.max(0, 1 - (timestamp - Date.parse(memory.updatedAt)) / 2.592e9);
        const score =
          relevance * 0.5 +
          recency * 0.15 +
          (memory.importance ?? 0.5) * 0.2 +
          (memory.pinned ? 0.15 : 0) +
          Math.min(memory.accessCount, 20) / 200;
        return { memory, score };
      })
      .filter(result => result.score > 0 || !query.query)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(Number(query.limit || 10), 100));

    for (const result of results) {
      result.memory.accessCount += 1;
      await this.repository.put(result.memory);
    }

    this.event('MemoryRetrieved', { query, count: results.length });
    return results;
  }

  async relate(from, to, type = 'related') {
    this.require(from);
    this.require(to);
    return this.repository.relate({ id: crypto.randomUUID(), from, to, type, createdAt: now() });
  }

  async expire() {
    for (const memory of this.repository.list().filter(item =>
      item.expiresAt && Date.parse(item.expiresAt) <= Date.now()
    )) {
      await this.archive(memory.id);
    }
  }

  require(id) {
    const memory = this.repository.get(id);
    if (!memory) throw Object.assign(new Error(`Unknown memory: ${id}`), { status: 404 });
    return memory;
  }

  event(type, payload) { this.events?.publish(type, payload); }
}
