// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — KnowledgeGraphService
// Phase 2.2 — AI Memory Intelligence
//
// Builds and maintains a relationship graph over all memories.
// Nodes: memories, people, projects, technologies, concepts
// Edges: tag-sharing, project-linking, semantic similarity, temporal proximity
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_DEBOUNCE_MS = 1000;

// ── Relationship types ────────────────────────────────────────────────────────
export const EDGE_TYPES = {
  SHARES_TAG: 'shares-tag',
  SAME_PROJECT: 'same-project',
  SAME_CONVERSATION: 'same-conversation',
  SEMANTIC_SIMILARITY: 'semantic-similarity',
  TEMPORAL_PROXIMITY: 'temporal-proximity',
  TYPE_AFFINITY: 'type-affinity',
  MANUALLY_LINKED: 'manually-linked',
};

export class KnowledgeGraphService {
  constructor(filePath) {
    this.filePath = filePath;
    /** @type {Map<string, KnowledgeNode>} */
    this.nodes = new Map();
    /** @type {Array<GraphEdge>} */
    this.edges = [];
    this._saveTimer = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async load() {
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      for (const node of data.nodes || []) this.nodes.set(node.id, node);
      this.edges = data.edges || [];
      console.log(`[KnowledgeGraph] Loaded ${this.nodes.size} nodes, ${this.edges.length} edges`);
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('[KnowledgeGraph] Load error:', err.message);
    }
  }

  async save() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify({ nodes: [...this.nodes.values()], edges: this.edges }, null, 2)
    );
  }

  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save().catch(console.error), SAVE_DEBOUNCE_MS);
  }

  // ── Node management ────────────────────────────────────────────────────────

  addNode(id, label, type, weight = 1) {
    const existing = this.nodes.get(id);
    if (existing) {
      existing.label = label;
      existing.weight = existing.weight + 0.1; // increment on re-add
    } else {
      this.nodes.set(id, { id, label, type, connections: [], weight });
    }
    this._scheduleSave();
    return this.nodes.get(id);
  }

  removeNode(id) {
    this.nodes.delete(id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    // Remove from other nodes' connection lists
    for (const node of this.nodes.values()) {
      node.connections = node.connections.filter(c => c !== id);
    }
    this._scheduleSave();
  }

  // ── Edge management ────────────────────────────────────────────────────────

  addEdge(fromId, toId, type, weight = 0.5) {
    if (fromId === toId) return; // no self-loops
    // Deduplicate: one edge per (from, to, type) pair
    const exists = this.edges.some(
      e => e.from === fromId && e.to === toId && e.type === type
    );
    if (!exists) {
      this.edges.push({ from: fromId, to: toId, type, weight });
      // Update connection lists
      const fromNode = this.nodes.get(fromId);
      const toNode = this.nodes.get(toId);
      if (fromNode && !fromNode.connections.includes(toId)) fromNode.connections.push(toId);
      if (toNode && !toNode.connections.includes(fromId)) toNode.connections.push(fromId);
      this._scheduleSave();
    }
  }

  // ── Graph building from memories ──────────────────────────────────────────

  /**
   * Rebuild the entire graph from a fresh list of memories.
   * Called on startup and after batch changes.
   */
  rebuildFromMemories(memories) {
    this.nodes.clear();
    this.edges = [];

    // 1. Add a node for every memory
    for (const m of memories) {
      this.nodes.set(m.id, {
        id: m.id,
        label: m.title,
        type: m.type || m.category || 'knowledge',
        connections: [],
        weight: m.importance ?? m.metadata?.importance ?? 5,
      });
    }

    // 2. Extract entity nodes from tags and metadata
    for (const m of memories) {
      for (const tag of m.tags || []) {
        const tagId = `tag:${tag.toLowerCase()}`;
        if (!this.nodes.has(tagId)) {
          this.nodes.set(tagId, { id: tagId, label: tag, type: 'concept', connections: [], weight: 1 });
        }
        this.addEdge(m.id, tagId, EDGE_TYPES.SHARES_TAG, 0.8);
      }
      // Project links
      const projectId = m.metadata?.projectId || m.relatedProjectId;
      if (projectId) {
        const projNodeId = `project:${projectId}`;
        if (!this.nodes.has(projNodeId)) {
          this.nodes.set(projNodeId, { id: projNodeId, label: projectId, type: 'project', connections: [], weight: 3 });
        }
        this.addEdge(m.id, projNodeId, EDGE_TYPES.SAME_PROJECT, 0.9);
      }
      // Conversation links
      const convId = m.metadata?.conversationId || m.relatedConversationId;
      if (convId) {
        const convNodeId = `conv:${convId}`;
        if (!this.nodes.has(convNodeId)) {
          this.nodes.set(convNodeId, { id: convNodeId, label: convId, type: 'conversation', connections: [], weight: 2 });
        }
        this.addEdge(m.id, convNodeId, EDGE_TYPES.SAME_CONVERSATION, 0.9);
      }
    }

    // 3. Temporal proximity edges (memories created within 1 hour of each other)
    const sorted = [...memories].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const delta = Math.abs((b.createdAt || 0) - (a.createdAt || 0));
      if (delta < 3_600_000) { // 1 hour
        this.addEdge(a.id, b.id, EDGE_TYPES.TEMPORAL_PROXIMITY, Math.max(0.1, 1 - delta / 3_600_000));
      }
    }

    // 4. Type-affinity edges (same type memories)
    const byType = {};
    for (const m of memories) {
      const t = m.type || m.category || 'custom';
      if (!byType[t]) byType[t] = [];
      byType[t].push(m.id);
    }
    for (const ids of Object.values(byType)) {
      for (let i = 0; i < Math.min(ids.length, 5); i++) {
        for (let j = i + 1; j < Math.min(ids.length, 5); j++) {
          this.addEdge(ids[i], ids[j], EDGE_TYPES.TYPE_AFFINITY, 0.3);
        }
      }
    }

    this._scheduleSave();
    console.log(`[KnowledgeGraph] Built: ${this.nodes.size} nodes, ${this.edges.length} edges`);
  }

  /**
   * Incrementally update graph when a single memory changes.
   */
  upsertMemory(memory) {
    this.addNode(memory.id, memory.title, memory.type || memory.category || 'knowledge',
      memory.importance ?? memory.metadata?.importance ?? 5);
    for (const tag of memory.tags || []) {
      const tagId = `tag:${tag.toLowerCase()}`;
      this.addNode(tagId, tag, 'concept', 1);
      this.addEdge(memory.id, tagId, EDGE_TYPES.SHARES_TAG, 0.8);
    }
  }

  // ── Traversal ─────────────────────────────────────────────────────────────

  /**
   * BFS neighbour discovery up to a given depth.
   * @param {string} nodeId
   * @param {number} depth
   * @returns {Array<{ node: KnowledgeNode, distance: number, edges: GraphEdge[] }>}
   */
  getNeighbours(nodeId, depth = 2) {
    const visited = new Set([nodeId]);
    const queue = [{ id: nodeId, distance: 0, edges: [] }];
    const result = [];

    while (queue.length > 0) {
      const { id, distance, edges } = queue.shift();
      if (distance > depth) break;

      const node = this.nodes.get(id);
      if (!node) continue;

      if (distance > 0) result.push({ node, distance, edges });

      if (distance < depth) {
        const outEdges = this.edges.filter(e => e.from === id || e.to === id);
        for (const edge of outEdges) {
          const nextId = edge.from === id ? edge.to : edge.from;
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push({ id: nextId, distance: distance + 1, edges: [...edges, edge] });
          }
        }
      }
    }

    return result.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get all edges connecting a specific memory to other memories.
   * Returns memory-node edges only (not tag/concept nodes).
   */
  getMemoryEdges(memoryId) {
    return this.edges
      .filter(e => (e.from === memoryId || e.to === memoryId))
      .map(e => ({
        edge: e,
        targetId: e.from === memoryId ? e.to : e.from,
        targetNode: this.nodes.get(e.from === memoryId ? e.to : e.from),
      }))
      .filter(({ targetNode }) => targetNode && !targetNode.id.startsWith('tag:') && !targetNode.id.startsWith('project:') && !targetNode.id.startsWith('conv:'));
  }

  /**
   * Add semantic similarity edge between two memories (called from MemoryIntelligenceService).
   */
  addSemanticEdge(idA, idB, similarity) {
    this.addEdge(idA, idB, EDGE_TYPES.SEMANTIC_SIMILARITY, similarity);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats() {
    const memoryNodes = [...this.nodes.values()].filter(n =>
      !n.id.startsWith('tag:') && !n.id.startsWith('project:') && !n.id.startsWith('conv:')
    );
    return {
      totalNodes: this.nodes.size,
      memoryNodes: memoryNodes.length,
      totalEdges: this.edges.length,
      edgesByType: this.edges.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      mostConnected: [...this.nodes.values()]
        .sort((a, b) => b.connections.length - a.connections.length)
        .slice(0, 5)
        .map(n => ({ id: n.id, label: n.label, connections: n.connections.length })),
    };
  }
}
