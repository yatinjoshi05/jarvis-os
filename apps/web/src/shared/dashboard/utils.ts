export class DashboardUtils {
  /**
   * Safe localStorage parser helper.
   */
  public static safeLoad<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Parse query string into searchable lowercase tokens.
   */
  public static tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Formats dynamic window grid layout classes based on columns count.
   */
  public static getGridColsClass(cols: number): string {
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3';
    }
  }
}
export default DashboardUtils;
