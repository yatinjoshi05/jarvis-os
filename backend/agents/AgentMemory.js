export class AgentMemory {
  static memories = new Map();

  /**
   * Record task memory for agent
   */
  static recordMemory(agentName, entry) {
    if (!this.memories.has(agentName)) {
      this.memories.set(agentName, []);
    }
    const agentMem = this.memories.get(agentName);
    const item = {
      id: `mem_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    agentMem.unshift(item);
    if (agentMem.length > 100) this.memories.set(agentName, agentMem.slice(0, 100));
    return item;
  }

  /**
   * Retrieve memories for agent
   */
  static getMemories(agentName) {
    return this.memories.get(agentName) || [];
  }
}
