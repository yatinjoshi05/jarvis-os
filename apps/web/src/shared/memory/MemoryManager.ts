import { MemoryRecord, Conversation, Message, MemorySearchResult } from './interfaces';
import { MemoryScope, MemoryCategory } from './types';
import { memoryRouter } from './MemoryRouter';
import { shortTermMemory } from './ShortTermMemory';
import { workingMemory } from './WorkingMemory';
import { MemorySearch } from './MemorySearch';
import { MemoryCompression } from './MemoryCompression';
import { memoryEventEmitter, MemoryEvents } from './events';

export class MemoryManager {
  public async saveMemory(
    key: string,
    value: any,
    category: MemoryCategory = 'fact',
    scope: MemoryScope = 'persistent',
    importance = 5,
    tags: string[] = []
  ): Promise<string> {
    const id = `${category}_${key}_${Date.now()}`;
    const provider = memoryRouter.getProvider(scope);

    const record: MemoryRecord = {
      id,
      key,
      scope,
      category,
      value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        importance,
        frequency: 1,
        lastAccessed: Date.now(),
        tags
      }
    };

    await provider.save(record);
    if (scope === 'persistent') {
      await this.evictOldMemories(100);
    }
    memoryEventEmitter.emit(MemoryEvents.MEMORY_CREATED, record);
    return id;
  }

  public async loadMemory(id: string, scope?: MemoryScope): Promise<MemoryRecord | null> {
    const provider = memoryRouter.getProvider(scope);
    const record = await provider.load(id);
    if (record) {
      memoryEventEmitter.emit(MemoryEvents.MEMORY_LOADED, { id });
    }
    return record;
  }

  public async updateMemory(id: string, value: any, updateMeta?: any, scope?: MemoryScope): Promise<void> {
    const provider = memoryRouter.getProvider(scope);
    const record = await provider.load(id);
    if (!record) {
      throw new Error(`[MemoryManager] Memory Record ${id} not found.`);
    }

    record.value = value;
    record.updatedAt = Date.now();
    if (updateMeta) {
      record.metadata = { ...record.metadata, ...updateMeta };
    }

    await provider.update(record);
    memoryEventEmitter.emit(MemoryEvents.MEMORY_UPDATED, record);
  }

  public async deleteMemory(id: string, scope?: MemoryScope): Promise<void> {
    const provider = memoryRouter.getProvider(scope);
    await provider.delete(id);
    memoryEventEmitter.emit(MemoryEvents.MEMORY_DELETED, { id });
  }

  public async clearMemory(scope?: MemoryScope): Promise<void> {
    if (scope) {
      const provider = memoryRouter.getProvider(scope);
      await provider.clear(scope);
    } else {
      const providerTransient = memoryRouter.getProvider('transient');
      const providerPersistent = memoryRouter.getProvider('persistent');
      const providerWorking = memoryRouter.getProvider('working');
      
      await providerTransient.clear('transient');
      await providerPersistent.clear('persistent');
      await providerWorking.clear('working');
    }
  }

  public async searchMemory(
    query: string,
    scope?: MemoryScope,
    category?: MemoryCategory
  ): Promise<MemorySearchResult[]> {
    const results = await MemorySearch.query(query, { scope, category });
    memoryEventEmitter.emit(MemoryEvents.MEMORY_SEARCHED, { query, resultsCount: results.length });
    return results;
  }

  public async compressMemory(messages: Message[]): Promise<Message[]> {
    return MemoryCompression.compress(messages);
  }

  public async getConversation(id: string): Promise<Conversation> {
    return shortTermMemory.getConversation(id);
  }

  public async setConversation(id: string, conversation: Conversation): Promise<void> {
    shortTermMemory.setActiveConversationId(id);
    await shortTermMemory.saveConversation(conversation);
  }

  // User Preferences memory accessors
  public async getPreference(key: string): Promise<any> {
    try {
      const provider = memoryRouter.getProvider('persistent');
      const records = await provider.loadByKey(key, 'persistent');
      const record = records.find((r) => r.category === 'preference');
      return record ? record.value : null;
    } catch (_) {
      return null;
    }
  }

  public async setPreference(key: string, value: any): Promise<void> {
    try {
      const provider = memoryRouter.getProvider('persistent');
      const records = await provider.loadByKey(key, 'persistent');
      const record = records.find((r) => r.category === 'preference');
      if (record) {
        await this.updateMemory(record.id, value, undefined, 'persistent');
      } else {
        await this.saveMemory(key, value, 'preference', 'persistent');
      }
    } catch (_) { /* ignore */ }
  }

  // Evict least accessed persistent memories if count exceeds limit
  public async evictOldMemories(limit = 100): Promise<void> {
    try {
      const provider = memoryRouter.getProvider('persistent');
      const records = await provider.search('', 'persistent');
      if (records.length <= limit) return;

      const sorted = [...records].sort((a, b) => {
        const impA = a.metadata?.importance ?? 5;
        const impB = b.metadata?.importance ?? 5;
        if (impA !== impB) return impA - impB;
        return (a.metadata?.lastAccessed ?? 0) - (b.metadata?.lastAccessed ?? 0);
      });

      const toRemoveCount = records.length - limit;
      const toRemove = sorted.slice(0, toRemoveCount);
      for (const r of toRemove) {
        await provider.delete(r.id);
      }
    } catch (e) {
      console.error('[MemoryManager] Eviction failed:', e);
    }
  }

  // Working Memory accessors
  public getObjective(): string {
    return workingMemory.getObjective();
  }

  public setObjective(objective: string) {
    workingMemory.setObjective(objective);
  }

  public getTasks(): string[] {
    return workingMemory.getTasks();
  }

  public setTasks(tasks: string[]) {
    workingMemory.setTasks(tasks);
  }
}

export const memoryManager = new MemoryManager();
export default memoryManager;
