// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — EmbeddingService Tests
// ─────────────────────────────────────────────────────────────────────────────

import { EmbeddingService, cosineSimilarity } from '../EmbeddingService.js';

describe('cosineSimilarity', () => {
  test('identical unit vectors → 1.0', () => {
    const v = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  test('orthogonal vectors → 0.0', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  test('opposite vectors → -1.0 (normalised)', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([-1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  test('mismatched lengths → 0', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  test('null inputs → 0', () => {
    expect(cosineSimilarity(null, null)).toBe(0);
  });
});

describe('EmbeddingService (TF-IDF fallback)', () => {
  let service;
  beforeEach(() => {
    delete process.env.VITE_OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    service = new EmbeddingService();
  });

  test('embed returns Float32Array', async () => {
    const vec = await service.embed('hello world test');
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBeGreaterThan(0);
  });

  test('embed normalises the vector (magnitude ≈ 1)', async () => {
    const vec = await service.embed('some text about software engineering');
    let mag = 0;
    for (const v of vec) mag += v * v;
    expect(Math.sqrt(mag)).toBeCloseTo(1, 3);
  });

  test('similar texts have higher similarity than dissimilar texts', async () => {
    const a = await service.embed('JavaScript TypeScript React frontend');
    const b = await service.embed('JavaScript React component hooks');
    const c = await service.embed('cooking pasta carbonara Italian cuisine');
    const simAB = cosineSimilarity(a, b);
    const simAC = cosineSimilarity(a, c);
    expect(simAB).toBeGreaterThan(simAC);
  });

  test('cache returns same vector on repeated call', async () => {
    const text = 'cache test text';
    const v1 = await service.embed(text);
    const v2 = await service.embed(text);
    expect(v1).toBe(v2); // Same reference from cache
  });

  test('embedMemory joins title + content + tags', async () => {
    const memory = { id: 'm1', title: 'React hooks', content: 'useState useEffect', summary: '', tags: ['javascript', 'frontend'] };
    const vec = await service.embedMemory(memory);
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBeGreaterThan(0);
  });
});
