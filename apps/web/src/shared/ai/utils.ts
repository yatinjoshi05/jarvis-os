export class AIUtils {
  /**
   * Reusable timeout wrapper for promises.
   */
  public static timeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * Simple delay promise helper.
   */
  public static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper to validate API keys and URLs.
   */
  public static validateConfig(providerId: string, config: { apiKey?: string; baseUrl?: string }): boolean {
    if (providerId === 'gemini' || providerId === 'openai' || providerId === 'claude') {
      if (!config.apiKey) return false;
    }
    if (config.baseUrl) {
      try {
        new URL(config.baseUrl);
      } catch (_) {
        return false;
      }
    }
    return true;
  }
}
