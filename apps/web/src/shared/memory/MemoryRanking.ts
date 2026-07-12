import { MemoryRecord, MemoryScore, MemorySearchResult } from './interfaces';
import { MEMORY_CONFIG } from './config';
import { MemoryUtils } from './utils';

export class MemoryRanking {
  /**
   * Scores and ranks a list of memory records against a query context.
   */
  public static rank(records: MemoryRecord[], query: string): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    for (const record of records) {
      const score = this.calculateScore(record, queryTerms);
      results.push({ record, score });
    }

    // Sort descending by total score
    return results.sort((a, b) => b.score.total - a.score.total);
  }

  private static calculateScore(record: MemoryRecord, queryTerms: string[]): MemoryScore {
    const weights = MEMORY_CONFIG.ranking;
    const now = Date.now();

    // 1. Recency Score (Exponential decay based on days since update)
    const daysOld = MemoryUtils.getDaysDifference(now, record.updatedAt);
    const recency = Math.exp(-0.2 * daysOld); // half-life of ~3.5 days

    // 2. Importance Score (Normalized from 1-10 scale)
    const rawImportance = record.metadata?.importance ?? 5;
    const importance = Math.min(Math.max(rawImportance, 1), 10) / 10;

    // 3. Frequency Score (Logarithmic scaling capped at 1.0)
    const accesses = record.metadata?.frequency ?? 1;
    const frequency = Math.min(Math.log(accesses + 1) / Math.log(10), 1.0);

    // 4. Relevance Score (Word overlap ratio)
    let relevance = 0;
    if (queryTerms.length > 0) {
      const content = typeof record.value === 'string'
        ? record.value
        : MemoryUtils.safeStringify(record.value);
      
      const searchableText = `${record.key} ${content}`.toLowerCase();
      let matchCount = 0;

      for (const term of queryTerms) {
        if (searchableText.includes(term)) {
          matchCount++;
        }
      }
      relevance = matchCount / queryTerms.length;
    }

    // Calculate weighted total score (capped at 1.0)
    const total = 
      (recency * weights.recencyWeight) +
      (importance * weights.importanceWeight) +
      (frequency * weights.frequencyWeight) +
      (relevance * weights.relevanceWeight);

    return {
      recency,
      importance,
      frequency,
      relevance,
      total: Math.min(total, 1.0)
    };
  }
}
export default MemoryRanking;
