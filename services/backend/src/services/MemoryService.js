/**
 * MemoryService — Public API for Conversation Context, Short-Term & Vector Memory
 */
export class MemoryService {
  constructor() {
    this.sessionTurns = [];
    this.workingCache = new Map();
    this.vectorDocuments = [];
  }

  /**
   * Record conversation turn in memory
   */
  async recordTurn(role, content) {
    try {
      this.sessionTurns.push({ role, content, timestamp: Date.now() });
      if (this.sessionTurns.length > 50) this.sessionTurns.shift();
      return { success: true };
    } catch (err) {
      console.error(`[MemoryService] Failed to record turn:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieve recent conversation context
   */
  async getRecentTurns(count = 10) {
    return this.sessionTurns.slice(-count);
  }

  /**
   * Store long-term knowledge fact
   */
  async storeKnowledge(id, text, metadata = {}) {
    this.vectorDocuments.push({ id, text, metadata, timestamp: Date.now() });
    return { success: true, id };
  }

  /**
   * Query long-term vector/knowledge index
   */
  async searchKnowledge(query, topK = 3) {
    const q = String(query).toLowerCase();
    const matches = this.vectorDocuments
      .filter(doc => doc.text.toLowerCase().includes(q))
      .slice(0, topK);
    return matches;
  }

  /**
   * Clear all memory tiers
   */
  async clearAll() {
    this.sessionTurns = [];
    this.workingCache.clear();
    this.vectorDocuments = [];
    return { success: true };
  }
}

export const memoryService = new MemoryService();
