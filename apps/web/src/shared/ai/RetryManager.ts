export interface RetryOptions {
  retries?: number;
  delay?: number;
  maxDelay?: number;
}

class RetryManager {
  async execute<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const retries = options.retries ?? 3;
    let delay = options.delay ?? 1000;
    const maxDelay = options.maxDelay ?? 10000;

    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        if (attempt > retries) {
          throw error;
        }

        // Check if error is non-retryable
        const status = error?.status || error?.statusCode;
        // Authentication, quota, missing resource, and timeout errors require
        // user/configuration action; retrying them only delays the UI error.
        if (status === 401 || status === 403 || status === 404 || status === 408 || status === 429) {
          throw error;
        }

        const msg = String(error?.message || error);
        if (msg.includes('401') || msg.includes('403') || msg.includes('404') || msg.includes('408') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          throw error;
        }

        // Fetch headers to check Retry-After
        const headers = error?.headers;
        let retryAfter = 0;

        if (headers) {
          const retryAfterHeader = headers.get?.('retry-after') || headers['retry-after'];
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed)) {
              retryAfter = parsed * 1000; // convert to ms
            }
          }
        }

        const is429 = status === 429 || msg.includes('429') || msg.includes('Rate limit reached');
        const isTransient = is429 || status === 500 || status === 503 || 
                            /network|timeout|fetch|connection/i.test(msg);

        if (!isTransient) {
          throw error;
        }

        const actualDelay = retryAfter > 0 ? retryAfter : Math.min(delay, maxDelay);
        console.warn(`[RetryManager] Transient error. Attempt ${attempt}/${retries} failed. Retrying in ${actualDelay}ms...`, error);
        
        await new Promise((resolve) => setTimeout(resolve, actualDelay));
        delay *= 2; // Exponential backoff
      }
    }
  }
}

export const retryManager = new RetryManager();
