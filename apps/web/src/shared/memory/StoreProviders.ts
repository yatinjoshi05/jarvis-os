import { MemoryProvider, MemoryRecord } from './interfaces';
import { MemoryScope, MemoryCategory } from './types';
import { MemoryOverflowError } from './errors';
import { MemoryUtils } from './utils';

export class LocalStorageProvider implements MemoryProvider {
  private prefix = 'jarvis_mem_';

  public async save(record: MemoryRecord): Promise<void> {
    try {
      const dataStr = MemoryUtils.safeStringify(record);
      localStorage.setItem(this.prefix + record.id, dataStr);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
        throw new MemoryOverflowError('LocalStorage capacity limit exceeded', { raw: e });
      }
      throw e;
    }
  }

  public async load(id: string): Promise<MemoryRecord | null> {
    try {
      const data = localStorage.getItem(this.prefix + id);
      if (!data) return null;
      return MemoryUtils.safeParse<MemoryRecord>(data, null as any);
    } catch (_) {
      return null;
    }
  }

  public async loadByKey(key: string, scope?: MemoryScope): Promise<MemoryRecord[]> {
    const list: MemoryRecord[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const itemKey = localStorage.key(i);
        if (itemKey && itemKey.startsWith(this.prefix)) {
          const raw = localStorage.getItem(itemKey);
          if (raw) {
            const record = MemoryUtils.safeParse<MemoryRecord>(raw, null as any);
            if (record && record.key === key) {
              if (!scope || record.scope === scope) {
                list.push(record);
              }
            }
          }
        }
      }
    } catch (_) { /* ignore */ }
    return list;
  }

  public async update(record: MemoryRecord): Promise<void> {
    const existing = await this.load(record.id);
    if (!existing) {
      throw new Error(`[LocalStorageProvider] Memory Record with ID "${record.id}" does not exist.`);
    }
    return this.save(record);
  }

  public async delete(id: string): Promise<void> {
    localStorage.removeItem(this.prefix + id);
  }

  public async search(query: string, scope?: MemoryScope, category?: MemoryCategory): Promise<MemoryRecord[]> {
    const list: MemoryRecord[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const itemKey = localStorage.key(i);
        if (itemKey && itemKey.startsWith(this.prefix)) {
          const raw = localStorage.getItem(itemKey);
          if (raw) {
            const record = MemoryUtils.safeParse<MemoryRecord>(raw, null as any);
            if (record) {
              if (scope && record.scope !== scope) continue;
              if (category && record.category !== category) continue;

              const content = typeof record.value === 'string' 
                ? record.value 
                : MemoryUtils.safeStringify(record.value);

              if (record.key.toLowerCase().includes(lowerQuery) || content.toLowerCase().includes(lowerQuery)) {
                list.push(record);
              }
            }
          }
        }
      }
    } catch (_) { /* ignore */ }
    return list;
  }

  public async clear(scope?: MemoryScope): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const itemKey = localStorage.key(i);
        if (itemKey && itemKey.startsWith(this.prefix)) {
          if (scope) {
            const raw = localStorage.getItem(itemKey);
            if (raw) {
              const record = MemoryUtils.safeParse<MemoryRecord>(raw, null as any);
              if (record && record.scope === scope) {
                keysToRemove.push(itemKey);
              }
            }
          } else {
            keysToRemove.push(itemKey);
          }
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (_) { /* ignore */ }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      localStorage.setItem('jarvis_mem_health', 'ok');
      localStorage.removeItem('jarvis_mem_health');
      return true;
    } catch (_) {
      return false;
    }
  }
}

export class InMemoryProvider implements MemoryProvider {
  private storage = new Map<string, MemoryRecord>();

  public async save(record: MemoryRecord): Promise<void> {
    this.storage.set(record.id, record);
  }

  public async load(id: string): Promise<MemoryRecord | null> {
    return this.storage.get(id) || null;
  }

  public async loadByKey(key: string, scope?: MemoryScope): Promise<MemoryRecord[]> {
    const list: MemoryRecord[] = [];
    for (const record of this.storage.values()) {
      if (record.key === key) {
        if (!scope || record.scope === scope) {
          list.push(record);
        }
      }
    }
    return list;
  }

  public async update(record: MemoryRecord): Promise<void> {
    if (!this.storage.has(record.id)) {
      throw new Error(`[InMemoryProvider] Record ${record.id} not found.`);
    }
    return this.save(record);
  }

  public async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }

  public async search(query: string, scope?: MemoryScope, category?: MemoryCategory): Promise<MemoryRecord[]> {
    const list: MemoryRecord[] = [];
    const lowerQuery = query.toLowerCase();

    for (const record of this.storage.values()) {
      if (scope && record.scope !== scope) continue;
      if (category && record.category !== category) continue;

      const content = typeof record.value === 'string'
        ? record.value
        : MemoryUtils.safeStringify(record.value);

      if (record.key.toLowerCase().includes(lowerQuery) || content.toLowerCase().includes(lowerQuery)) {
        list.push(record);
      }
    }
    return list;
  }

  public async clear(scope?: MemoryScope): Promise<void> {
    if (scope) {
      for (const [id, record] of this.storage.entries()) {
        if (record.scope === scope) {
          this.storage.delete(id);
        }
      }
    } else {
      this.storage.clear();
    }
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }
}
