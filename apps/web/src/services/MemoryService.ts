import { ecosystemDb, MemoryVectorRecord } from '../shared/database/EcosystemDatabase';

export class MemoryService {
  private static instance: MemoryService;

  private constructor() {}

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  public getMemoryContext(): MemoryVectorRecord[] {
    return ecosystemDb.getMemory();
  }

  public storeContext(context: string, type = 'general', score = 1.0): MemoryVectorRecord {
    const record: MemoryVectorRecord = {
      id: `VEC-${Date.now()}`,
      context,
      type,
      score,
      timestamp: new Date().toISOString(),
    };
    ecosystemDb.saveMemory(record);
    return record;
  }

  public queryMemory(query: string): MemoryVectorRecord[] {
    const q = query.toLowerCase();
    return this.getMemoryContext().filter((m) => m.context.toLowerCase().includes(q));
  }
}

export const memoryService = MemoryService.getInstance();
