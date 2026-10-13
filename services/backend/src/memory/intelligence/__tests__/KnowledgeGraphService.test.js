// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — KnowledgeGraphService Tests
// ─────────────────────────────────────────────────────────────────────────────

import { KnowledgeGraphService, EDGE_TYPES } from '../KnowledgeGraphService.js';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

let tmpDir;
let graph;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jarvis-graph-test-'));
  graph = new KnowledgeGraphService(path.join(tmpDir, 'kg.json'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('Node & Edge management', () => {
  test('addNode creates a node', () => {
    graph.addNode('m1', 'Test Memory', 'knowledge', 5);
    expect(graph.nodes.has('m1')).toBe(true);
    expect(graph.nodes.get('m1').label).toBe('Test Memory');
  });

  test('addEdge creates an undirected connection', () => {
    graph.addNode('m1', 'A', 'knowledge');
    graph.addNode('m2', 'B', 'knowledge');
    graph.addEdge('m1', 'm2', EDGE_TYPES.SHARES_TAG, 0.8);
    const m1 = graph.nodes.get('m1');
    const m2 = graph.nodes.get('m2');
    expect(m1.connections).toContain('m2');
    expect(m2.connections).toContain('m1');
    expect(graph.edges.length).toBe(1);
  });

  test('addEdge deduplicates: same (from, to, type) adds only one edge', () => {
    graph.addNode('a', 'A', 'knowledge');
    graph.addNode('b', 'B', 'knowledge');
    graph.addEdge('a', 'b', EDGE_TYPES.SHARES_TAG);
    graph.addEdge('a', 'b', EDGE_TYPES.SHARES_TAG);
    expect(graph.edges.filter(e => e.type === EDGE_TYPES.SHARES_TAG).length).toBe(1);
  });

  test('addEdge ignores self-loops', () => {
    graph.addNode('a', 'A', 'knowledge');
    graph.addEdge('a', 'a', EDGE_TYPES.SHARES_TAG);
    expect(graph.edges.length).toBe(0);
  });

  test('removeNode removes edges too', () => {
    graph.addNode('m1', 'A', 'knowledge');
    graph.addNode('m2', 'B', 'knowledge');
    graph.addEdge('m1', 'm2', EDGE_TYPES.SHARES_TAG);
    graph.removeNode('m1');
    expect(graph.nodes.has('m1')).toBe(false);
    expect(graph.edges.length).toBe(0);
    expect(graph.nodes.get('m2').connections).not.toContain('m1');
  });
});

describe('BFS getNeighbours', () => {
  test('returns direct neighbours at distance 1', () => {
    graph.addNode('center', 'Center', 'knowledge');
    graph.addNode('n1', 'N1', 'knowledge');
    graph.addNode('n2', 'N2', 'knowledge');
    graph.addEdge('center', 'n1', EDGE_TYPES.SHARES_TAG);
    graph.addEdge('center', 'n2', EDGE_TYPES.SHARES_TAG);

    const neighbours = graph.getNeighbours('center', 1);
    const ids = neighbours.map(n => n.node.id);
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).not.toContain('center');
  });

  test('returns depth-2 neighbours', () => {
    graph.addNode('a', 'A', 'knowledge');
    graph.addNode('b', 'B', 'knowledge');
    graph.addNode('c', 'C', 'knowledge');
    graph.addEdge('a', 'b', EDGE_TYPES.SHARES_TAG);
    graph.addEdge('b', 'c', EDGE_TYPES.SHARES_TAG);

    const neighbours = graph.getNeighbours('a', 2);
    const ids = neighbours.map(n => n.node.id);
    expect(ids).toContain('c');
    const cEntry = neighbours.find(n => n.node.id === 'c');
    expect(cEntry.distance).toBe(2);
  });
});

describe('rebuildFromMemories', () => {
  test('creates nodes for all memories', () => {
    const mems = [
      { id: 'm1', title: 'A', type: 'knowledge', tags: ['react'], importance: 5, createdAt: Date.now() },
      { id: 'm2', title: 'B', type: 'knowledge', tags: ['react', 'ts'], importance: 5, createdAt: Date.now() },
    ];
    graph.rebuildFromMemories(mems);
    expect(graph.nodes.has('m1')).toBe(true);
    expect(graph.nodes.has('m2')).toBe(true);
    // Both share 'react' tag
    expect(graph.nodes.has('tag:react')).toBe(true);
  });

  test('creates temporal proximity edges', () => {
    const now = Date.now();
    const mems = [
      { id: 'a', title: 'A', type: 'knowledge', tags: [], importance: 5, createdAt: now - 1000 },
      { id: 'b', title: 'B', type: 'knowledge', tags: [], importance: 5, createdAt: now },
    ];
    graph.rebuildFromMemories(mems);
    const temporalEdges = graph.edges.filter(e => e.type === EDGE_TYPES.TEMPORAL_PROXIMITY);
    expect(temporalEdges.length).toBeGreaterThan(0);
  });
});

describe('getStats', () => {
  test('returns correct node and edge counts', () => {
    graph.addNode('m1', 'A', 'knowledge');
    graph.addNode('m2', 'B', 'knowledge');
    graph.addEdge('m1', 'm2', EDGE_TYPES.SHARES_TAG);
    const stats = graph.getStats();
    expect(stats.totalNodes).toBe(2);
    expect(stats.totalEdges).toBe(1);
  });
});
