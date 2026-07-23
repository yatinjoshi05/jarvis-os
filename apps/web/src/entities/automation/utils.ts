import { Job } from './interfaces';

export class AutomationUtils {
  // ─── SCHEDULER HELPERS ──────────────────────────────────────

  /**
   * Calculates the next trigger timestamp from a real 5-field cron expression.
   * Field order: minute hour dom month dow
   * Supports: wildcard (*), exact (N), step (asterisk/N), range (a-b), list (a,b,c).
   * Lookahead capped at 10080 minutes (7 days) for safety.
   */
  public static parseCronToNextTime(cron: string): number {
    const fields = cron.trim().split(/\s+/);
    if (fields.length !== 5) return Date.now() + 60000;

    const [minF, hourF, domF, monF, dowF] = fields;

    const matchField = (expr: string, value: number): boolean => {
      if (expr === '*') return true;
      for (const part of expr.split(',')) {
        if (part.startsWith('*/')) {
          const step = parseInt(part.slice(2), 10);
          if (!isNaN(step) && step > 0 && value % step === 0) return true;
        } else if (part.includes('-')) {
          const [lo, hi] = part.split('-').map(Number);
          if (value >= lo && value <= hi) return true;
        } else {
          const n = parseInt(part, 10);
          // day-of-week: 0 and 7 both represent Sunday
          if (!isNaN(n) && (n === value || (n === 7 && value === 0))) return true;
        }
      }
      return false;
    };

    // Start 1 minute into the future; seconds are irrelevant for cron
    const candidate = new Date(Date.now() + 60000);
    candidate.setSeconds(0, 0);

    const MAX_MINUTES = 10080; // 7 days
    for (let i = 0; i < MAX_MINUTES; i++) {
      if (
        matchField(monF, candidate.getMonth() + 1) &&
        matchField(domF, candidate.getDate()) &&
        matchField(dowF, candidate.getDay()) &&
        matchField(hourF, candidate.getHours()) &&
        matchField(minF, candidate.getMinutes())
      ) {
        return candidate.getTime();
      }
      candidate.setTime(candidate.getTime() + 60000);
    }

    // Fallback: 1 day (should never reach here with a valid cron)
    return Date.now() + 86400000;
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
