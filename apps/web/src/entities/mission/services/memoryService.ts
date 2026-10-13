export interface MemoryRecord {
  id: string
  key: string
  content: string
  tags: string[]
  createdAt: string
}

class MemoryService {
  private memoryStore = new Map<string, MemoryRecord>()

  public async saveMemory(key: string, content: string, tags: string[] = []): Promise<MemoryRecord> {
    const record: MemoryRecord = {
      id: `mem-${Date.now()}`,
      key,
      content,
      tags,
      createdAt: new Date().toISOString(),
    }
    this.memoryStore.set(key, record)
    return record
  }

  public async retrieveMemory(key: string): Promise<MemoryRecord | null> {
    return this.memoryStore.get(key) || null
  }

  public async searchMemory(query: string): Promise<MemoryRecord[]> {
    const results: MemoryRecord[] = []
    const qLower = query.toLowerCase()
    for (const record of this.memoryStore.values()) {
      if (record.content.toLowerCase().includes(qLower) || record.key.toLowerCase().includes(qLower)) {
        results.push(record)
      }
    }
    return results
  }
}

export const memoryService = new MemoryService()
