// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryLifecycleManager Tests
// ─────────────────────────────────────────────────────────────────────────────

import { jest } from '@jest/globals';
import { MemoryLifecycleManager } from '../MemoryLifecycleManager.js';

function makeMemory(overrides = {}) {
  const now = Date.now();
  return {
    id: `m_${Math.random()}`,
    title: 'Test Memory',
    content: 'Test content',
    summary: 'Summary',
    archived: false,
    pinned: false,
    tags: [],
    importance: 5,
    accessCount: 0,
    metadata: { importance: 5 },
    createdAt: now,
    updatedAt: new Date().toISOString(),
    lastAccessed: now,  // default: now
    ...overrides,
  };
}

function makeRepository(memories = []) {
  const store = new Map(memories.map(m => [m.id, m]));
  return {
    list: () => [...store.values()],
    get: id => store.get(id) || null,
    put: async (m) => { store.set(m.id, m); return m; },
  };
}

describe('MemoryLifecycleManager.classify', () => {
  let mgr;
  beforeEach(() => {
    mgr = new MemoryLifecycleManager({ repository: makeRepository(), events: null });
  });

  test('archived → "archived"', () => {
    expect(mgr.classify(makeMemory({ archived: true }))).toBe('archived');
  });

  test('recently accessed → "working"', () => {
    expect(mgr.classify(makeMemory({ lastAccessed: Date.now() - 1000 }))).toBe('working');
  });

  test('created today, not accessed recently → "short-term"', () => {
    const now = Date.now();
    const memory = makeMemory({
      createdAt: now - 60_000 * 60,       // created 1 hour ago
      lastAccessed: now - 2 * 3_600_000,  // last accessed 2 hours ago (> WORKING_WINDOW_MS = 1h)
    });
    expect(mgr.classify(memory)).toBe('short-term');
  });

  test('old + low importance + not accessed → "forgotten"', () => {
    const sixtyDaysAgo = Date.now() - 61 * 86_400_000;
    const memory = makeMemory({
      createdAt: sixtyDaysAgo,
      lastAccessed: sixtyDaysAgo,  // Explicitly override default 'now'
      importance: 1,
      accessCount: 0,
    });
    expect(mgr.classify(memory)).toBe('forgotten');
  });

  test('high importance + old → "long-term"', () => {
    const tenDaysAgo = Date.now() - 10 * 86_400_000;
    const memory = makeMemory({
      createdAt: tenDaysAgo,
      lastAccessed: tenDaysAgo,  // Not accessed recently
      importance: 8,
      accessCount: 5,
    });
    expect(mgr.classify(memory)).toBe('long-term');
  });
});

describe('MemoryLifecycleManager.runRetentionPolicy', () => {
  test('archives forgotten memories', async () => {
    const sixtyDaysAgo = Date.now() - 61 * 86_400_000;
    const forgotten = makeMemory({ createdAt: sixtyDaysAgo, lastAccessed: sixtyDaysAgo, importance: 1, accessCount: 0 });
    const normal = makeMemory({});
    const repo = makeRepository([forgotten, normal]);
    const events = { publish: () => {} };
    const mgr = new MemoryLifecycleManager({ repository: repo, events });
    await mgr.runRetentionPolicy();
    expect(repo.get(forgotten.id).archived).toBe(true);
    expect(repo.get(normal.id).archived).toBe(false);
  });

  test('does not archive pinned memories', async () => {
    const sixtyDaysAgo = Date.now() - 61 * 86_400_000;
    const pinned = makeMemory({ createdAt: sixtyDaysAgo, lastAccessed: sixtyDaysAgo, importance: 1, pinned: true, accessCount: 0 });
    const repo = makeRepository([pinned]);
    const mgr = new MemoryLifecycleManager({ repository: repo, events: null });
    await mgr.runRetentionPolicy();
    expect(repo.get(pinned.id).archived).toBe(false);
  });
});

describe('MemoryLifecycleManager.promote / demote', () => {
  test('promote increases importance by 2', async () => {
    const memory = makeMemory({ importance: 5 });
    const repo = makeRepository([memory]);
    const mgr = new MemoryLifecycleManager({ repository: repo, events: { publish: () => {} } });
    const result = await mgr.promote(memory.id);
    expect(result.importance).toBe(7);
  });

  test('demote decreases importance by 2', async () => {
    const memory = makeMemory({ importance: 5 });
    const repo = makeRepository([memory]);
    const mgr = new MemoryLifecycleManager({ repository: repo, events: { publish: () => {} } });
    const result = await mgr.demote(memory.id);
    expect(result.importance).toBe(3);
  });

  test('promote caps at 10', async () => {
    const memory = makeMemory({ importance: 9 });
    const repo = makeRepository([memory]);
    const mgr = new MemoryLifecycleManager({ repository: repo, events: { publish: () => {} } });
    const result = await mgr.promote(memory.id);
    expect(result.importance).toBe(10);
  });

  test('demote floors at 1', async () => {
    const memory = makeMemory({ importance: 2 });
    const repo = makeRepository([memory]);
    const mgr = new MemoryLifecycleManager({ repository: repo, events: { publish: () => {} } });
    const result = await mgr.demote(memory.id);
    expect(result.importance).toBe(1);
  });
});
