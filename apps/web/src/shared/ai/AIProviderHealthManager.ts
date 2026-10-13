/**
 * AIProviderHealthManager.ts
 * Intelligent AI Provider Health & Failover Management for JARVIS OS.
 * Continuously tracks status, latency, request/failure counts, health scores,
 * and handles background recovery timers without polling loops.
 */

import { ProviderFactory } from './ProviderFactory';
import { aiLogger } from './Logger';
import { AI_CONFIG } from './config';

export type ProviderStatus =
  | 'ONLINE'
  | 'BUSY'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'OFFLINE'
  | 'DISABLED';

export interface ProviderHealthMetrics {
  id: string;
  name: string;
  status: ProviderStatus;
  latencyMs: number;
  requestCount: number;
  failureCount: number;
  consecutiveFailures: number;
  lastChecked: number;
  healthScore: number; // 0 - 100%
  errorCounts: {
    quotaExceeded: number;
    authError: number;
    networkError: number;
    timeoutError: number;
    rateLimitError: number;
  };
  lastErrorReason?: string;
}

export interface FailoverLogEntry {
  id: string;
  timestamp: number;
  failedProviderId: string;
  failedProviderName: string;
  reason: string;
  targetProviderId: string;
  targetProviderName: string;
  success: boolean;
}

type HealthListener = (metrics: Map<string, ProviderHealthMetrics>) => void;

class AIProviderHealthManager {
  private storageKey = 'jarvis_ai_health_settings';
  private metrics: Map<string, ProviderHealthMetrics> = new Map();
  private recoveryTimers: Map<string, any> = new Map();
  private listeners: Set<HealthListener> = new Set();
  private failoverLogs: FailoverLogEntry[] = [];

  private priorityOrder: string[] = ['nvidia', 'gemini', 'claude', 'openai', 'ollama', 'local'];
  private autoFailoverEnabled = true;
  private disabledProviders: Set<string> = new Set();
  private globalCooldownUntil = 0;

  private providerNames: Record<string, string> = {
    nvidia: 'NVIDIA NIM',
    gemini: 'Gemini',
    claude: 'Claude',
    openai: 'OpenAI',
    ollama: 'Ollama',
    local: 'Local Model',
  };

  // Recovery intervals in MS
  private recoveryIntervals: Record<string, number> = {
    TIMEOUT: 30000,        // 30 seconds
    RATE_LIMITED: 120000,   // 2 minutes
    QUOTA_EXCEEDED: 1800000,// 30 minutes
    OFFLINE: 60000,        // 1 minute
  };

  constructor() {
    this.initializeProviders();
    this.loadPersistedSettings();
  }

  public recordAllProvidersFailed(cooldownMs = 30000) {
    this.globalCooldownUntil = Date.now() + cooldownMs;
    aiLogger.warn('AIHealthManager', `All AI providers failed. Entering global backoff cooldown for ${cooldownMs / 1000}s`);
  }

  public isGlobalSystemInCooldown(): boolean {
    return Date.now() < this.globalCooldownUntil;
  }

  private initializeProviders() {
    const knownProviders = ['nvidia', 'gemini', 'claude', 'openai', 'ollama', 'local'];
    knownProviders.forEach((id) => {
      this.ensureProvider(id);
    });

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        knownProviders.forEach((id) => {
          if (!this.disabledProviders.has(id)) {
            if (id === 'ollama' && !(AI_CONFIG.providers.ollama as any).enabled) {
              const m = this.metrics.get('ollama');
              if (m) m.status = 'DISABLED';
              return;
            }
            this.recheckProvider(id).catch(() => {});
          }
        });
      }, 1000);
    }
  }

  public ensureProvider(id: string): ProviderHealthMetrics {
    let m = this.metrics.get(id);
    if (!m) {
      m = {
        id,
        name: this.providerNames[id] || id,
        status: this.disabledProviders.has(id) ? 'DISABLED' : 'ONLINE',
        latencyMs: 0,
        requestCount: 0,
        failureCount: 0,
        consecutiveFailures: 0,
        lastChecked: Date.now(),
        healthScore: 100,
        errorCounts: {
          quotaExceeded: 0,
          authError: 0,
          networkError: 0,
          timeoutError: 0,
          rateLimitError: 0,
        },
      };
      this.metrics.set(id, m);
    }
    return m;
  }

  public registerCustomProvider(id: string, name: string) {
    this.providerNames[id] = name;
    if (!this.priorityOrder.includes(id)) {
      this.priorityOrder.push(id);
    }
    const m = this.ensureProvider(id);
    m.name = name;
    this.notify();
  }

  private loadPersistedSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.priorityOrder) && parsed.priorityOrder.length > 0) {
            this.priorityOrder = parsed.priorityOrder;
          }
          if (typeof parsed.autoFailoverEnabled === 'boolean') {
            this.autoFailoverEnabled = parsed.autoFailoverEnabled;
          }
          if (Array.isArray(parsed.disabledProviders)) {
            this.disabledProviders = new Set(parsed.disabledProviders);
            this.disabledProviders.forEach((id) => {
              const m = this.metrics.get(id);
              if (m) m.status = 'DISABLED';
            });
          }
        }
      }
    } catch (_) {}
  }

  private persistSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          priorityOrder: this.priorityOrder,
          autoFailoverEnabled: this.autoFailoverEnabled,
          disabledProviders: Array.from(this.disabledProviders),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      }
    } catch (_) {}
  }

  private calculateHealthScore(m: ProviderHealthMetrics): number {
    if (m.status === 'DISABLED') return 0;
    if (m.status === 'QUOTA_EXCEEDED' || m.status === 'OFFLINE') return 0;
    if (m.status === 'RATE_LIMITED' || m.status === 'TIMEOUT') return 25;
    if (m.status === 'BUSY') return 70;

    if (m.requestCount === 0) return 100;

    const failureRatio = m.failureCount / m.requestCount;
    const baseScore = Math.max(0, 100 - Math.round(failureRatio * 100));
    const consecutivePenalty = m.consecutiveFailures * 15;
    return Math.max(10, Math.min(100, baseScore - consecutivePenalty));
  }

  private notify() {
    this.persistSettings();
    this.listeners.forEach((listener) => {
      try {
        listener(new Map(this.metrics));
      } catch (err) {
        console.error('[AIProviderHealthManager] Error in listener:', err);
      }
    });
  }

  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public recordSuccess(id: string, latencyMs: number) {
    this.globalCooldownUntil = 0;
    const m = this.ensureProvider(id);

    m.requestCount++;
    m.consecutiveFailures = 0;
    m.latencyMs = m.latencyMs === 0 ? latencyMs : Math.round((m.latencyMs * 0.7) + (latencyMs * 0.3));
    m.lastChecked = Date.now();

    if (m.status !== 'DISABLED') {
      m.status = latencyMs > 8000 ? 'BUSY' : 'ONLINE';
    }

    m.healthScore = this.calculateHealthScore(m);
    this.notify();
  }

  public recordError(
    id: string,
    error: any,
    suggestedStatus?: ProviderStatus
  ): ProviderStatus {
    const m = this.ensureProvider(id);

    m.requestCount++;
    m.failureCount++;
    m.consecutiveFailures++;
    m.lastChecked = Date.now();

    const errMsg = String(error?.message || error || '').toLowerCase();
    const errStatus = error?.status || error?.statusCode;

    let finalStatus: ProviderStatus = suggestedStatus || 'OFFLINE';

    if (errStatus === 429 || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
      finalStatus = 'QUOTA_EXCEEDED';
      m.errorCounts.quotaExceeded++;
    } else if (errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
      finalStatus = 'RATE_LIMITED';
      m.errorCounts.rateLimitError++;
    } else if (errStatus === 401 || errStatus === 403 || errMsg.includes('unauthorized') || errMsg.includes('invalid api key')) {
      finalStatus = 'OFFLINE';
      m.errorCounts.authError++;
    } else if (errStatus === 404 || errMsg.includes('404') || errMsg.includes('not found')) {
      finalStatus = 'OFFLINE';
      m.errorCounts.networkError++;
    } else if (errMsg.includes('timeout') || errMsg.includes('timed out') || errStatus === 504) {
      finalStatus = 'TIMEOUT';
      m.errorCounts.timeoutError++;
    } else if (suggestedStatus) {
      finalStatus = suggestedStatus;
    } else {
      finalStatus = 'OFFLINE';
      m.errorCounts.networkError++;
    }

    m.status = finalStatus;
    m.lastErrorReason = error?.message || String(error);
    m.healthScore = this.calculateHealthScore(m);

    this.scheduleRecovery(id, finalStatus);
    this.notify();

    return finalStatus;
  }

  private scheduleRecovery(id: string, status: ProviderStatus) {
    if (this.recoveryTimers.has(id)) {
      clearTimeout(this.recoveryTimers.get(id));
      this.recoveryTimers.delete(id);
    }

    if (id === 'ollama' && !(AI_CONFIG.providers.ollama as any).enabled) {
      return;
    }

    const interval = this.recoveryIntervals[status];
    if (!interval) return;

    aiLogger.info('AIHealthManager', `Scheduled recovery check for ${id} (${status}) in ${interval / 1000}s`);

    const timer = setTimeout(async () => {
      this.recoveryTimers.delete(id);
      await this.recheckProvider(id);
    }, interval);

    this.recoveryTimers.set(id, timer);
  }

  public async recheckProvider(id: string): Promise<boolean> {
    const m = this.ensureProvider(id);
    if (m.status === 'DISABLED') return false;

    aiLogger.info('AIHealthManager', `Executing health recovery check for provider: ${id}`);
    m.lastChecked = Date.now();

    try {
      const registered = ProviderFactory.getRegisteredProviders();
      if (!registered.includes(id)) {
        m.status = 'OFFLINE';
        this.notify();
        return false;
      }

      const instance = ProviderFactory.create(id);
      const startTime = Date.now();
      const isHealthy = await instance.healthCheck();
      const elapsed = Date.now() - startTime;

      if (isHealthy) {
        m.status = 'ONLINE';
        m.consecutiveFailures = 0;
        m.latencyMs = elapsed;
        m.healthScore = this.calculateHealthScore(m);
        aiLogger.info('AIHealthManager', `Provider ${id} recovered successfully! Status: ONLINE`);
        this.notify();
        return true;
      } else {
        m.status = 'OFFLINE';
        m.healthScore = this.calculateHealthScore(m);
        this.notify();
        return false;
      }
    } catch (err: any) {
      m.status = 'OFFLINE';
      m.lastErrorReason = err?.message || String(err);
      m.healthScore = this.calculateHealthScore(m);
      this.notify();
      return false;
    }
  }

  public logFailover(
    failedId: string,
    reason: string,
    targetId: string,
    success: boolean
  ) {
    const entry: FailoverLogEntry = {
      id: `failover_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      failedProviderId: failedId,
      failedProviderName: this.getProviderName(failedId),
      reason,
      targetProviderId: targetId,
      targetProviderName: this.getProviderName(targetId),
      success,
    };

    this.failoverLogs.unshift(entry);
    if (this.failoverLogs.length > 50) this.failoverLogs.pop();

    aiLogger.warn(
      'ProviderFailover',
      `${this.getProviderName(failedId)} failed (${reason}) ➔ Switched to ${this.getProviderName(targetId)} ➔ ${success ? 'Response successful' : 'Failed'}`
    );

    this.notify();
  }

  public getFailoverLogs(): FailoverLogEntry[] {
    return [...this.failoverLogs];
  }

  public getProviderName(id: string): string {
    return this.providerNames[id] || id;
  }

  public getMetrics(id: string): ProviderHealthMetrics | undefined {
    return this.ensureProvider(id);
  }

  public getAllMetrics(): Map<string, ProviderHealthMetrics> {
    return new Map(this.metrics);
  }

  public getPriorityOrder(): string[] {
    return [...this.priorityOrder];
  }

  public setPriorityOrder(order: string[]) {
    this.priorityOrder = [...order];
    this.notify();
  }

  public movePriorityUp(id: string) {
    const index = this.priorityOrder.indexOf(id);
    if (index > 0) {
      const prev = this.priorityOrder[index - 1];
      this.priorityOrder[index - 1] = id;
      this.priorityOrder[index] = prev;
      this.notify();
    }
  }

  public movePriorityDown(id: string) {
    const index = this.priorityOrder.indexOf(id);
    if (index >= 0 && index < this.priorityOrder.length - 1) {
      const next = this.priorityOrder[index + 1];
      this.priorityOrder[index + 1] = id;
      this.priorityOrder[index] = next;
      this.notify();
    }
  }

  public isAutoFailoverEnabled(): boolean {
    return this.autoFailoverEnabled;
  }

  public setAutoFailoverEnabled(enabled: boolean) {
    this.autoFailoverEnabled = enabled;
    this.notify();
  }

  public setProviderEnabled(id: string, enabled: boolean) {
    if (enabled) {
      this.disabledProviders.delete(id);
      const m = this.ensureProvider(id);
      m.status = 'ONLINE';
    } else {
      this.disabledProviders.add(id);
      const m = this.ensureProvider(id);
      m.status = 'DISABLED';
    }
    this.notify();
  }

  public isProviderEnabled(id: string): boolean {
    return !this.disabledProviders.has(id);
  }

  public isProviderHealthy(id: string): boolean {
    if (this.disabledProviders.has(id)) return false;
    const m = this.metrics.get(id);
    if (!m) return true;
    return m.status !== 'QUOTA_EXCEEDED' && m.status !== 'OFFLINE';
  }

  public getOrderedHealthyProviders(): string[] {
    return this.priorityOrder.filter((id) => {
      if (this.disabledProviders.has(id)) return false;
      const m = this.metrics.get(id);
      if (!m) return true;
      return m.status !== 'QUOTA_EXCEEDED' && m.status !== 'OFFLINE';
    });
  }

  public resetMetrics() {
    this.metrics.clear();
    this.initializeProviders();
    this.notify();
  }
}

export const aiHealthManager = new AIProviderHealthManager();
export default aiHealthManager;
