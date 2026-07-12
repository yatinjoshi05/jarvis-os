import { MemorySearchResult, MemoryRecord } from './interfaces';
import { MemoryScope, MemoryCategory } from './types';
import { memoryRouter } from './MemoryRouter';
import { MemoryRanking } from './MemoryRanking';
import { memoryLogger } from './Logger';

export class MemorySearch {
  /**
   * Search through provider store and rank results.
   */
  public static async query(
    searchTerm: string,
    options?: {
      scope?: MemoryScope;
      category?: MemoryCategory;
      projectId?: string;
    }
  ): Promise<MemorySearchResult[]> {
    memoryLogger.debug('Search', `Searching memory for query: "${searchTerm}"`);

    const provider = memoryRouter.getProvider(options?.scope);
    const records = await provider.search(searchTerm, options?.scope, options?.category);

    // Apply project filter if needed
    let filteredRecords = records;
    if (options?.projectId) {
      filteredRecords = records.filter(
        (r) => r.metadata?.projectId === options.projectId
      );
    }

    // Update access metadata frequency for matched records
    this.incrementAccessFrequency(filteredRecords);

    // Rank matching records
    return MemoryRanking.rank(filteredRecords, searchTerm);
  }

  private static incrementAccessFrequency(records: MemoryRecord[]) {
    // In background, increment access metadata metrics
    records.forEach(async (record) => {
      try {
        const provider = memoryRouter.getProvider(record.scope);
        const meta = record.metadata || {};
        meta.frequency = (meta.frequency ?? 1) + 1;
        meta.lastAccessed = Date.now();
        record.metadata = meta;
        record.updatedAt = Date.now();
        await provider.update(record);
      } catch (_) { /* ignore */ }
    });
  }
}
export default MemorySearch;
