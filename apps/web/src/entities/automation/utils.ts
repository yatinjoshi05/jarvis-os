import { Job } from './interfaces';

export class AutomationUtils {
  // ─── SCHEDULER HELPERS ──────────────────────────────────────
  
  /**
   * Simulates calculating the next trigger timestamp from a cron expression.
   */
  public static parseCronToNextTime(cron: string): number {
    const now = Date.now();
    
    // Quick mock parsing for common intervals
    if (cron.startsWith('*/5')) {
      return now + 5 * 60 * 1000; // 5 minutes
    }
    if (cron.startsWith('0 0')) {
      return now + 24 * 3600 * 1000; // 1 day
    }
    if (cron.startsWith('0 *')) {
      return now + 3600 * 1000; // 1 hour
    }
    
    // Default fallback: 1 minute
    return now + 60 * 1000;
  }

  // ─── QUEUE HELPERS ──────────────────────────────────────────

  /**
   * Priority comparator. High priority comes first, then earliest deadline, then creation.
   */
  public static prioritize(a: Job, b: Job): number {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const weightA = priorityWeight[a.priority] || 1;
    const weightB = priorityWeight[b.priority] || 1;

    if (weightA !== weightB) {
      return weightB - weightA; // High priority first
    }

    if (a.executeAfter && b.executeAfter) {
      return a.executeAfter - b.executeAfter; // Earliest schedule first
    }

    return a.createdAt - b.createdAt; // Oldest first
  }

  // ─── RETRY HELPERS ──────────────────────────────────────────

  /**
   * Calculates exponential backoff retry delay.
   */
  public static calculateBackoffDelay(retryCount: number, baseDelayMs = 5000): number {
    return baseDelayMs * Math.pow(2, Math.max(0, retryCount - 1));
  }

  // ─── TEMPLATE HELPERS ───────────────────────────────────────

  /**
   * Replaces placeholders formatted as {{variable}} inside text.
   */
  public static interpolate(template: string, vars?: Record<string, any>): string {
    if (!vars) return template;
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const value = key.split('.').reduce((acc: any, part: string) => {
        return acc ? acc[part] : undefined;
      }, vars);
      
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }

  // ─── WEBHOOK HELPERS ────────────────────────────────────────

  /**
   * Generates a verification signature for webhook security.
   */
  public static generateSignature(payload: any, secret?: string): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const key = secret || 'jarvis_default_webhook_secret';
    
    // Simple fast checksum hash simulation
    let hash = 0;
    const combined = raw + key;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `sha256=${Math.abs(hash).toString(16)}`;
  }

  public static verifySignature(payload: any, signature: string, secret?: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return expected === signature;
  }
}

export default AutomationUtils;
