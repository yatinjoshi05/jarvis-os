// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryIntelligenceService
// Phase 2.2 — AI Memory Intelligence
//
// Orchestrates all intelligence features:
//   • Semantic search (vector + keyword blend)
//   • Related memory discovery
//   • AI summary generation
//   • Importance scoring
//   • Insight generation
//   • Context injection payloads
// ─────────────────────────────────────────────────────────────────────────────

const IMPORTANCE_WEIGHTS = {
  accessFrequency:  0.20,
  recency:          0.20,
  pinWeight:        0.15,
  relationshipDensity: 0.15,
  aiConfidence:     0.15,
  tagRichness:      0.10,
  baseImportance:   0.05,
};

const INSIGHT_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class MemoryIntelligenceService {
  constructor({ repository, embeddingService, vectorStore, knowledgeGraph, events }) {
    this.repository = repository;
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
    this.knowledgeGraph = knowledgeGraph;
    this.events = events;

    /** @type {Array} cached insights */
    this._insights = [];
    this._insightsGeneratedAt = 0;
  }

  // ── Lifecycle hooks (called by MemoryService) ─────────────────────────────

  async onMemoryCreated(memory) {
    await this._embedAndIndex(memory);
    this.knowledgeGraph.upsertMemory(memory);
    this._invalidateInsights();
  }

  async onMemoryUpdated(memory) {
    await this._embedAndIndex(memory);
    this.knowledgeGraph.upsertMemory(memory);
    this._invalidateInsights();
  }

  onMemoryDeleted(id) {
    this.vectorStore.delete(id);
    this.knowledgeGraph.removeNode(id);
    this._invalidateInsights();
  }

  async _embedAndIndex(memory) {
    try {
      const vec = await this.embeddingService.embedMemory(memory);
      this.vectorStore.upsert(memory.id, vec);
    } catch (err) {
      console.warn('[MemoryIntelligence] Embedding failed for', memory.id, ':', err.message);
    }
  }

  _invalidateInsights() {
    this._insightsGeneratedAt = 0;
  }

  // ── Semantic Search ────────────────────────────────────────────────────────

  /**
   * Semantic + keyword blended search.
   * Returns SemanticSearchResult[]
   */
  async semanticSearch(query, { limit = 10, threshold = 0.1, category } = {}) {
    const memories = this.repository.list().filter(m =>
      !m.archived &&
      (!m.expiresAt || Date.parse(m.expiresAt) > Date.now()) &&
      (!category || m.category === category || m.type === category)
    );

    // 1. Vector search
    let semanticScores = new Map(); // id → semantic score
    if (this.vectorStore.size > 0) {
      try {
        const queryVec = await this.embeddingService.embed(query);
        const hits = this.vectorStore.search(queryVec, Math.min(limit * 3, 50), threshold);
        for (const { id, score } of hits) semanticScores.set(id, score);
      } catch (err) {
        console.warn('[MemoryIntelligence] Vector search error:', err.message);
      }
    }

    // 2. Keyword search
    const queryTerms = new Set(
      query.toLowerCase().match(/[a-z0-9_]{2,}/g) || []
    );
    const keywordScores = new Map();
    for (const m of memories) {
      if (queryTerms.size === 0) { keywordScores.set(m.id, 0); continue; }
      const corpus = new Set(
        `${m.title} ${m.content} ${m.summary} ${(m.tags || []).join(' ')}`
          .toLowerCase()
          .match(/[a-z0-9_]{2,}/g) || []
      );
      const overlap = [...queryTerms].filter(t => corpus.has(t)).length;
      keywordScores.set(m.id, overlap / queryTerms.size);
    }

    // 3. Blend: 0.7 semantic + 0.3 keyword
    const now = Date.now();
    const candidateIds = new Set([
      ...semanticScores.keys(),
      ...[...keywordScores.entries()].filter(([, s]) => s > 0).map(([id]) => id),
    ]);

    const results = [];
    for (const id of candidateIds) {
      const memory = this.repository.get(id);
      if (!memory || memory.archived) continue;

      const sem = semanticScores.get(id) || 0;
      const kw = keywordScores.get(id) || 0;

      const touchMs = typeof memory.updatedAt === 'number'
        ? memory.updatedAt
        : memory.updatedAt
          ? Date.parse(memory.updatedAt)
          : typeof memory.createdAt === 'number'
            ? memory.createdAt
            : memory.createdAt
              ? Date.parse(memory.createdAt)
              : now;
      const recency = Math.max(0, 1 - (now - (isNaN(touchMs) ? now : touchMs)) / 2.592e9);
      const pinBonus = memory.pinned ? 0.1 : 0;
      const importanceBonus = (memory.importance ?? memory.metadata?.importance ?? 5) / 100;

      const totalScore = sem * 0.55 + kw * 0.25 + recency * 0.10 + importanceBonus * 0.05 + pinBonus;

      results.push({
        entry: memory,
        semanticScore: sem,
        totalScore,
        explanation: this._explainRetrieval(memory, sem, kw, recency),
      });
    }

    // Sort, deduplicate, slice
    return results
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  _explainRetrieval(memory, sem, kw, recency) {
    const parts = [];
    if (sem > 0.7) parts.push('highly semantically similar');
    else if (sem > 0.4) parts.push('conceptually related');
    if (kw > 0.5) parts.push('contains matching keywords');
    if (memory.pinned) parts.push('pinned by you');
    if (recency > 0.9) parts.push('very recent');
    else if (recency > 0.5) parts.push('accessed recently');
    const touchMs = typeof memory.updatedAt === 'number'
      ? memory.updatedAt
      : memory.updatedAt
        ? Date.parse(memory.updatedAt)
        : typeof memory.createdAt === 'number'
          ? memory.createdAt
          : memory.createdAt
            ? Date.parse(memory.createdAt)
            : Date.now();
    const age = Math.max(0, Math.floor((Date.now() - (isNaN(touchMs) ? Date.now() : touchMs)) / 86_400_000));
    parts.push(`last updated ${age === 0 ? 'today' : `${age} day${age !== 1 ? 's' : ''} ago`}`);
    return parts.length ? `Recalled because: ${parts.join(', ')}.` : 'Retrieved by relevance.';
  }

  // ── Related Memories ──────────────────────────────────────────────────────

  /**
   * Find memories related to a given memory id.
   * Uses vector similarity + graph edges.
   * Returns RelatedMemory[]
   */
  async findRelated(memoryId, limit = 5) {
    const source = this.repository.get(memoryId);
    if (!source) return [];

    const related = new Map(); // id → { confidence, reason, type }

    // 1. Vector neighbours
    if (this.vectorStore.has(memoryId)) {
      const sourceVec = this.vectorStore.index.get(memoryId);
      if (sourceVec) {
        const hits = this.vectorStore.search(sourceVec, limit * 2 + 1, 0.3);
        for (const { id, score } of hits) {
          if (id === memoryId) continue;
          related.set(id, { confidence: score, reason: 'semantically similar content', type: 'semantic-similarity' });
        }
      }
    }

    // 2. Graph edges
    const graphNeighbours = this.knowledgeGraph.getMemoryEdges(memoryId);
    for (const { targetId, edge } of graphNeighbours) {
      if (targetId === memoryId) continue;
      const existing = related.get(targetId);
      const conf = edge.weight || 0.5;
      if (!existing || existing.confidence < conf) {
        let reason = '';
        switch (edge.type) {
          case 'shares-tag': reason = 'shares common tags'; break;
          case 'same-project': reason = 'belongs to the same project'; break;
          case 'same-conversation': reason = 'from the same conversation'; break;
          case 'temporal-proximity': reason = 'created around the same time'; break;
          case 'type-affinity': reason = 'same memory type'; break;
          default: reason = 'related by knowledge graph';
        }
        related.set(targetId, { confidence: conf, reason, type: edge.type });
      }
    }

    // 3. Tag overlap (lightweight)
    const sourceTags = new Set(source.tags || []);
    if (sourceTags.size > 0) {
      for (const m of this.repository.list()) {
        if (m.id === memoryId || m.archived) continue;
        const overlap = (m.tags || []).filter(t => sourceTags.has(t)).length;
        if (overlap > 0) {
          const conf = overlap / Math.max(sourceTags.size, (m.tags || []).length);
          const existing = related.get(m.id);
          if (!existing || existing.confidence < conf) {
            related.set(m.id, { confidence: conf, reason: `shares ${overlap} tag${overlap > 1 ? 's' : ''}: ${[...(m.tags || []).filter(t => sourceTags.has(t))].join(', ')}`, type: 'shares-tag' });
          }
        }
      }
    }

    // 4. Build results
    const results = [];
    for (const [id, { confidence, reason, type }] of related) {
      const entry = this.repository.get(id);
      if (!entry || entry.archived) continue;
      results.push({
        entry,
        relationship: {
          fromId: memoryId,
          toId: id,
          type,
          confidence,
          reason,
        },
      });
    }

    return results
      .sort((a, b) => b.relationship.confidence - a.relationship.confidence)
      .slice(0, limit);
  }

  // ── AI Summary Generation ─────────────────────────────────────────────────

  /**
   * Generate an AI summary for a memory.
   * Calls Gemini (fast) → stores result in memory metadata.
   */
  async generateSummary(memoryId) {
    const memory = this.repository.get(memoryId);
    if (!memory) throw Object.assign(new Error('Memory not found'), { status: 404 });

    const existing = this.repository.getSummary(memoryId);
    if (existing && Date.now() - existing.generatedAt < 86_400_000) return existing; // cached 24h

    const prompt = `Analyse this memory entry and respond ONLY with a JSON object matching this exact schema:
{
  "short": "One sentence summary (max 120 chars)",
  "detailed": "2-3 sentence detailed explanation",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "entities": ["entity names: people, companies, tools"],
  "technologies": ["tech stack items mentioned"]
}

Memory title: ${memory.title}
Memory content: ${memory.content || memory.summary}
Memory tags: ${(memory.tags || []).join(', ')}

Respond ONLY with valid JSON.`;

    const text = await this._callAI(prompt);
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {
        short: memory.summary?.slice(0, 120) || memory.title,
        detailed: memory.content?.slice(0, 300) || memory.summary,
        keyPoints: [],
        entities: [],
        technologies: memory.tags || [],
      };
    }

    const summary = {
      memoryId,
      short: parsed.short || memory.title,
      detailed: parsed.detailed || memory.summary,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6) : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities.slice(0, 8) : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies.slice(0, 8) : [],
      generatedAt: Date.now(),
    };

    await this.repository.putSummary(memoryId, summary);
    return summary;
  }

  // ── Importance Scoring ────────────────────────────────────────────────────

  /**
   * Multi-factor importance score for a memory.
   * Returns { score: 1-10, factors: ImportanceFactors }
   */
  computeImportance(memory) {
    const now = Date.now();
    const ageMs = now - Date.parse(memory.updatedAt || memory.createdAt || now);
    const accessCount = memory.accessCount || 0;

    const factors = {
      accessFrequency: Math.min(1, Math.log(accessCount + 1) / Math.log(50)),
      recency: Math.exp(-ageMs / (30 * 86_400_000)),
      pinWeight: memory.pinned ? 1 : 0,
      relationshipDensity: Math.min(1, (memory.relationships?.length || 0) / 10),
      aiConfidence: memory.confidence ?? memory.metadata?.confidence ?? 0.5,
      tagRichness: Math.min(1, (memory.tags?.length || 0) / 5),
      baseImportance: (memory.importance ?? memory.metadata?.importance ?? 5) / 10,
    };

    let score = 0;
    for (const [factor, weight] of Object.entries(IMPORTANCE_WEIGHTS)) {
      score += (factors[factor] || 0) * weight;
    }

    return { score: Math.max(1, Math.min(10, Math.round(score * 10))), factors };
  }

  // ── AI Insights ───────────────────────────────────────────────────────────

  /**
   * Generate pattern-based insights from all memories.
   * Cached for 5 minutes.
   */
  async generateInsights() {
    if (this._insights.length > 0 && Date.now() - this._insightsGeneratedAt < INSIGHT_REFRESH_INTERVAL_MS) {
      return this._insights;
    }

    const memories = this.repository.list().filter(m => !m.archived);
    if (memories.length === 0) return [];

    const insights = [];
    const now = Date.now();
    const id = () => `insight_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Frequency: top-accessed memories
    const topAccessed = [...memories]
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, 3);
    if (topAccessed[0] && topAccessed[0].accessCount > 2) {
      insights.push({
        id: id(), category: 'frequency',
        text: `"${topAccessed[0].title}" is your most-accessed memory with ${topAccessed[0].accessCount} views.`,
        confidence: 0.9, relatedIds: topAccessed.map(m => m.id),
        generatedAt: now, icon: 'TrendingUp',
      });
    }

    // 2. Growth streak: consecutive days with new memories
    const byDay = {};
    for (const m of memories) {
      const day = new Date(m.createdAt || now).toDateString();
      byDay[day] = (byDay[day] || 0) + 1;
    }
    const streak = this._computeStreak(byDay);
    if (streak >= 2) {
      insights.push({
        id: id(), category: 'streak',
        text: `You've added memories for ${streak} consecutive days. Your knowledge base is growing steadily.`,
        confidence: 0.85, relatedIds: [],
        generatedAt: now, icon: 'Flame',
      });
    }

    // 3. Stale: high-importance memories not accessed recently
    const stale = memories.filter(m =>
      (m.importance ?? m.metadata?.importance ?? 5) >= 7 &&
      now - (m.lastAccessed || m.createdAt || 0) > 14 * 86_400_000
    ).slice(0, 3);
    if (stale.length > 0) {
      insights.push({
        id: id(), category: 'stale',
        text: `${stale.length} important memor${stale.length > 1 ? 'ies haven\'t' : 'y hasn\'t'} been reviewed in 2+ weeks: "${stale[0].title}"${stale.length > 1 ? ` and ${stale.length - 1} more` : ''}.`,
        confidence: 0.8, relatedIds: stale.map(m => m.id),
        generatedAt: now, icon: 'Clock',
      });
    }

    // 4. Tag analysis: dominant topic
    const tagFreq = {};
    for (const m of memories) {
      for (const t of m.tags || []) tagFreq[t] = (tagFreq[t] || 0) + 1;
    }
    const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topTags.length > 0 && topTags[0][1] >= 3) {
      insights.push({
        id: id(), category: 'frequency',
        text: `Your most frequent topic is "${topTags[0][0]}" (${topTags[0][1]} memories). ${topTags[1] ? `Followed by "${topTags[1][0]}".` : ''}`,
        confidence: 0.88, relatedIds: memories.filter(m => m.tags?.includes(topTags[0][0])).map(m => m.id).slice(0, 5),
        generatedAt: now, icon: 'Tag',
      });
    }

    // 5. Cross-reference: memories sharing the same project
    const byProject = {};
    for (const m of memories) {
      const p = m.metadata?.projectId;
      if (p) { if (!byProject[p]) byProject[p] = []; byProject[p].push(m.id); }
    }
    const bigProjects = Object.entries(byProject).filter(([, ids]) => ids.length >= 3);
    if (bigProjects.length > 0) {
      const [projId, projIds] = bigProjects[0];
      insights.push({
        id: id(), category: 'cross-reference',
        text: `Project "${projId}" has ${projIds.length} memories linked. This is your most documented project.`,
        confidence: 0.82, relatedIds: projIds.slice(0, 5),
        generatedAt: now, icon: 'GitBranch',
      });
    }

    // 6. Recent activity summary
    const recentCount = memories.filter(m => now - (m.createdAt || 0) < 7 * 86_400_000).length;
    if (recentCount > 0) {
      insights.push({
        id: id(), category: 'activity',
        text: `${recentCount} memor${recentCount > 1 ? 'ies' : 'y'} added in the last 7 days. ${recentCount >= 5 ? 'High activity week!' : 'Keep building your knowledge base.'}`,
        confidence: 0.95, relatedIds: [],
        generatedAt: now, icon: 'Activity',
      });
    }

    this._insights = insights.slice(0, 6);
    this._insightsGeneratedAt = now;
    return this._insights;
  }

  _computeStreak(byDay) {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (byDay[d.toDateString()]) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  // ── Context Injection ─────────────────────────────────────────────────────

  /**
   * Build a formatted memory context string for AI injection.
   * @param {string} query — the user's current message
   * @param {number} limit — max snippets
   * @returns {{ snippets, tokenEstimate, contextString }}
   */
  async buildContext(query, limit = 5) {
    const results = await this.semanticSearch(query, { limit, threshold: 0.2 });

    const snippets = results.map(r => ({
      memoryId: r.entry.id,
      title: r.entry.title,
      type: r.entry.type || r.entry.category,
      summary: r.entry.summary || r.entry.content?.slice(0, 200),
      relevanceScore: r.totalScore,
      recallReason: r.explanation,
    }));

    const contextString = snippets.length > 0
      ? `[JARVIS MEMORY CONTEXT]\nThe following memories are relevant to this request:\n\n${
          snippets.map((s, i) =>
            `${i + 1}. [${s.type?.toUpperCase()}] ${s.title}\n   ${s.summary}\n   (${s.recallReason})`
          ).join('\n\n')
        }\n[END MEMORY CONTEXT]\n`
      : '';

    return {
      snippets,
      tokenEstimate: Math.ceil(contextString.length / 4),
      contextString,
    };
  }

  // ── AI call helper ─────────────────────────────────────────────────────────

  async _callAI(prompt) {
    // Try Gemini first (fastest)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (err) {
        console.warn('[MemoryIntelligence] Gemini AI call failed:', err.message);
      }
    }

    // Try OpenAI
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 512,
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.warn('[MemoryIntelligence] OpenAI AI call failed:', err.message);
      }
    }

    return '';
  }
}
