export class MemoryUtils {
  /**
   * Safe JSON parse.
   */
  public static safeParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json) as T;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Safe JSON stringify.
   */
  public static safeStringify(value: any, fallback = ''): string {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Calculate difference in days between two timestamps.
   */
  public static getDaysDifference(timeA: number, timeB: number): number {
    const diffMs = Math.abs(timeA - timeB);
    return diffMs / (1000 * 60 * 60 * 24);
  }

  /**
   * Validate MemoryRecord content.
   */
  public static validateRecord(record: any): boolean {
    if (!record || typeof record !== 'object') return false;
    if (!record.id || typeof record.id !== 'string') return false;
    if (!record.key || typeof record.key !== 'string') return false;
    if (!record.scope || typeof record.scope !== 'string') return false;
    if (!record.category || typeof record.category !== 'string') return false;
    if (record.createdAt === undefined || typeof record.createdAt !== 'number') return false;
    return true;
  }
}
export default MemoryUtils;
