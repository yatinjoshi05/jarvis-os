import { MemoryRecord, MemoryMetadata } from './interfaces';
import { memoryRouter } from './MemoryRouter';
import { MemoryCategory } from './types';
import { memoryEventEmitter, MemoryEvents } from './events';

class LongTermMemory {
  public async saveFact(key: string, value: any, category: MemoryCategory = 'fact', importance = 5, tags: string[] = []): Promise<void> {
    const provider = memoryRouter.getProvider('persistent');
    
    const record: MemoryRecord = {
      id: `fact_${key}_${Date.now()}`,
      key,
      scope: 'persistent',
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
    memoryEventEmitter.emit(MemoryEvents.MEMORY_CREATED, record);
  }

  public async getFact(key: string): Promise<MemoryRecord[]> {
    const provider = memoryRouter.getProvider('persistent');
    return provider.loadByKey(key, 'persistent');
  }

  public async getByCategory(category: MemoryCategory): Promise<MemoryRecord[]> {
    const provider = memoryRouter.getProvider('persistent');
    return provider.search('', 'persistent', category);
  }

  public async updateFact(id: string, value: any, updateMeta?: Partial<MemoryMetadata>): Promise<void> {
    const provider = memoryRouter.getProvider('persistent');
    const existing = await provider.load(id);
    if (!existing) {
      throw new Error(`[LongTermMemory] Record ${id} not found.`);
    }

    existing.value = value;
    existing.updatedAt = Date.now();
    if (updateMeta) {
      existing.metadata = { ...existing.metadata, ...updateMeta };
    }

    await provider.update(existing);
    memoryEventEmitter.emit(MemoryEvents.MEMORY_UPDATED, existing);
  }

  public async deleteFact(id: string): Promise<void> {
    const provider = memoryRouter.getProvider('persistent');
    await provider.delete(id);
    memoryEventEmitter.emit(MemoryEvents.MEMORY_DELETED, { id });
  }

  public async clear() {
    const provider = memoryRouter.getProvider('persistent');
    await provider.clear('persistent');
  }
}

export const longTermMemory = new LongTermMemory();
export default longTermMemory;
