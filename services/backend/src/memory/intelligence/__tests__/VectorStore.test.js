// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — VectorStore Tests
// ─────────────────────────────────────────────────────────────────────────────

import { VectorStore } from '../VectorStore.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let tmpDir;
let store;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jarvis-test-'));
  store = new VectorStore(path.join(tmpDir, 'vectors.json'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('VectorStore.upsert / search', () => {
  test('upsert adds a vector and has() returns true', () => {
    store.upsert('m1', new Float32Array([1, 0, 0]));
    expect(store.has('m1')).toBe(true);
    expect(store.size).toBe(1);
  });

  test('search returns top-k nearest by cosine', () => {
    store.upsert('a', new Float32Array([1, 0, 0]));
    store.upsert('b', new Float32Array([0.9, 0.1, 0]));
    store.upsert('c', new Float32Array([0, 0, 1]));

    const queryVec = new Float32Array([1, 0, 0]);
    const results = store.search(queryVec, 2, 0);
    expect(results[0].id).toBe('a');
    expect(results[1].id).toBe('b');
    expect(results.length).toBe(2);
  });

  test('search respects threshold', () => {
    store.upsert('x', new Float32Array([1, 0]));
    store.upsert('y', new Float32Array([0, 1]));
    const results = store.search(new Float32Array([1, 0]), 10, 0.5);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('x');
  });

  test('delete removes the vector', () => {
    store.upsert('m1', new Float32Array([1, 0]));
    store.delete('m1');
    expect(store.has('m1')).toBe(false);
    expect(store.size).toBe(0);
  });

  test('similarity between two stored vectors', () => {
    store.upsert('a', new Float32Array([1, 0]));
    store.upsert('b', new Float32Array([1, 0]));
    expect(store.similarity('a', 'b')).toBeCloseTo(1, 5);
  });
});

describe('VectorStore persistence', () => {
  test('save / load round-trip preserves vectors', async () => {
    const vec = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    store.upsert('mem1', vec);
    await store.save();

    const store2 = new VectorStore(path.join(tmpDir, 'vectors.json'));
    await store2.load();

    expect(store2.has('mem1')).toBe(true);
    const loaded = store2.index.get('mem1');
    for (let i = 0; i < vec.length; i++) {
      expect(loaded[i]).toBeCloseTo(vec[i], 5);
    }
  });

  test('load on missing file starts empty without error', async () => {
    const newStore = new VectorStore(path.join(tmpDir, 'nonexistent.json'));
    await expect(newStore.load()).resolves.toBeUndefined();
    expect(newStore.size).toBe(0);
  });
});
