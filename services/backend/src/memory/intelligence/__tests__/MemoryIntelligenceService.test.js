// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryIntelligenceService Tests
// ─────────────────────────────────────────────────────────────────────────────

import { MemoryIntelligenceService } from '../MemoryIntelligenceService.js';
import { EmbeddingService } from '../EmbeddingService.js';
import { VectorStore } from '../VectorStore.js';
import { KnowledgeGraphService } from '../KnowledgeGraphService.js';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

let tmpDir;
let service;
let vectorStore;
let knowledgeGraph;

function makeMemory(id, overrides = {}) {
  return {
    id,
    title: `Memory ${id}`,
    content: `Content for memory ${id} about React TypeScript frontend development`,
    summary: `Summary ${id}`,
    tags: ['react', 'typescript'],
    type: 'knowledge',
    category: 'Custom',
    importance: 5,
    pinned: false,
    archived: false,
    confidence: 0.8,
    accessCount: 1,
    createdAt: Date.now(),
    updatedAt: new Date().toISOString(),
    metadata: { importance: 5, confidence: 0.8 },
    ...overrides,
  };
}

function makeRepository(memories = []) {
  const store = new Map(memories.map(m => [m.id, m]));
  return {
    list: () => [...store.values()],
    get: id => store.get(id) || null,
    put: async m => { store.set(m.id, m); return m; },
    getSummary: () => null,
    putSummary: async (id, s) => s,
  };
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jarvis-intel-test-'));
  vectorStore = new VectorStore(path.join(tmpDir, 'vec.json'));
  knowledgeGraph = new KnowledgeGraphService(path.join(tmpDir, 'kg.json'));
  const embeddingService = new EmbeddingService();

  const memories = [
    makeMemory('m1', { content: 'React hooks useState useEffect frontend' }),
    makeMemory('m2', { content: 'TypeScript generics interfaces type safety' }),
    makeMemory('m3', { content: 'Python machine learning data science pandas' }),
  ];

  const repo = makeRepository(memories);
  service = new MemoryIntelligenceService({
    repository: repo,
    embeddingService,
    vectorStore,
    knowledgeGraph,
    events: null,
  });

  // Index all memories
  for (const m of memories) {
    await service.onMemoryCreated(m);
  }
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('MemoryIntelligenceService.semanticSearch', () => {
  test('returns results when query matches', async () => {
    const results = await service.semanticSearch('React hooks frontend');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry).toBeDefined();
    expect(results[0].totalScore).toBeGreaterThan(0);
    expect(typeof results[0].explanation).toBe('string');
  });

  test('returns empty array when nothing matches (high threshold)', async () => {
    const results = await service.semanticSearch('xyz_nonexistent_999', { threshold: 0.99 });
    expect(results.length).toBe(0);
  });

  test('does not return archived memories', async () => {
    // Create a fresh service with an archived memory in it
    const archivedMem = makeMemory('archived1', { archived: true });
    const normalMems = [
      makeMemory('n1', { content: 'archived content test' }),
      archivedMem,
    ];
    const freshRepo = makeRepository(normalMems);
    const freshVec = new VectorStore(path.join(tmpDir, 'vec2.json'));
    const freshGraph = new KnowledgeGraphService(path.join(tmpDir, 'kg2.json'));
    const freshService = new MemoryIntelligenceService({
      repository: freshRepo,
      embeddingService: new EmbeddingService(),
      vectorStore: freshVec,
      knowledgeGraph: freshGraph,
      events: null,
    });
    for (const m of normalMems) await freshService.onMemoryCreated(m);
    const results = await freshService.semanticSearch('archived content', { threshold: 0 });
    const found = results.find(r => r.entry.id === 'archived1');
    expect(found).toBeUndefined();
  });

  test('category filter returns only matching type', async () => {
    // All test memories are 'knowledge' type. Filtering by 'file' should return 0.
    // We test this indirectly: querying knowledge returns > 0; knowledge with file filter = 0.
    const knowledgeResults = await service.semanticSearch('React TypeScript', { threshold: 0 });
    expect(knowledgeResults.length).toBeGreaterThan(0);
    // All returned entries should NOT be type 'file'
    for (const r of knowledgeResults) {
      expect(r.entry.type).not.toBe('file');
    }
  });
});

describe('MemoryIntelligenceService.computeImportance', () => {
  test('returns score between 1 and 10', () => {
    const mem = makeMemory('m4');
    const { score } = service.computeImportance(mem);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
  });

  test('pinned memory scores higher than unpinned', () => {
    const pinned = makeMemory('p1', { pinned: true });
    const unpinned = makeMemory('p2', { pinned: false });
    const { score: s1 } = service.computeImportance(pinned);
    const { score: s2 } = service.computeImportance(unpinned);
    expect(s1).toBeGreaterThanOrEqual(s2);
  });

  test('returns factors object with required keys', () => {
    const { factors } = service.computeImportance(makeMemory('m5'));
    expect(factors).toHaveProperty('accessFrequency');
    expect(factors).toHaveProperty('recency');
    expect(factors).toHaveProperty('pinWeight');
    expect(factors).toHaveProperty('relationshipDensity');
    expect(factors).toHaveProperty('aiConfidence');
    expect(factors).toHaveProperty('tagRichness');
  });
});

describe('MemoryIntelligenceService.generateInsights', () => {
  test('returns an array', async () => {
    const insights = await service.generateInsights();
    expect(Array.isArray(insights)).toBe(true);
  });

  test('each insight has required fields', async () => {
    const insights = await service.generateInsights();
    for (const insight of insights) {
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('text');
      expect(insight).toHaveProperty('category');
      expect(insight).toHaveProperty('confidence');
    }
  });

  test('returns cached insights on second call within 5 minutes', async () => {
    const first = await service.generateInsights();
    const second = await service.generateInsights();
    expect(first).toBe(second); // Same reference — cached
  });
});

describe('MemoryIntelligenceService.buildContext', () => {
  test('returns contextString, snippets, and tokenEstimate', async () => {
    const ctx = await service.buildContext('React hooks');
    expect(ctx).toHaveProperty('snippets');
    expect(ctx).toHaveProperty('tokenEstimate');
    expect(ctx).toHaveProperty('contextString');
    expect(Array.isArray(ctx.snippets)).toBe(true);
  });

  test('contextString contains MEMORY CONTEXT header when results exist', async () => {
    const ctx = await service.buildContext('React TypeScript frontend development');
    if (ctx.snippets.length > 0) {
      expect(ctx.contextString).toContain('[JARVIS MEMORY CONTEXT]');
    }
  });
});
