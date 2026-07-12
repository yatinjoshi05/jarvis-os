import { memoryManager } from '../memory';

export class AgentMemory {
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Save a private fact (visible only to this agent's keyspace).
   */
  public async savePrivateFact(key: string, value: any) {
    const namespacedKey = `agent_${this.agentId}_${key}`;
    await memoryManager.saveMemory(namespacedKey, value, 'fact', 'persistent', 5, [this.agentId, 'private']);
  }

  /**
   * Load private fact.
   */
  public async loadPrivateFact(key: string): Promise<any> {
    const namespacedKey = `agent_${this.agentId}_${key}`;
    const records = await memoryManager.searchMemory(namespacedKey, 'persistent', 'fact');
    return records.length > 0 ? records[0].record.value : null;
  }

  /**
   * Save a shared fact (visible to all agents).
   */
  public async saveSharedFact(key: string, value: any) {
    await memoryManager.saveMemory(key, value, 'fact', 'persistent', 5, ['shared']);
  }

  /**
   * Load shared fact.
   */
  public async loadSharedFact(key: string): Promise<any> {
    const records = await memoryManager.searchMemory(key, 'persistent', 'fact');
    return records.length > 0 ? records[0].record.value : null;
  }

  /**
   * Save temporary workspace context.
   */
  public async saveTemporaryContext(key: string, value: any) {
    await memoryManager.saveMemory(`temp_${this.agentId}_${key}`, value, 'reasoning', 'working');
  }
}
export default AgentMemory;
