import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { ProviderFactory } from "./ProviderFactory";
import { aiLogger } from "./Logger";
import { aiEventEmitter, AIEvents } from "./AIEvents";
import { AI_CONFIG } from "./config";
import { ErrorManager } from "./ErrorManager";
import { aiHealthManager } from "./AIProviderHealthManager";
import { notificationManager } from "../dashboard/notification";
import { providerModelMapper, PromptTier } from "./ProviderModelMapper";
import { identitySettings } from "./IdentitySettings";

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProviderId = AI_CONFIG.defaultProvider || 'gemini';
  private fallbackProviderIds = [...AI_CONFIG.fallbackProviders];
  private lastUsedModel = AI_CONFIG.providers.gemini.model;

  // Deduplication cache with guaranteed lock release
  private inFlightRequests: Map<string, Promise<string>> = new Map();

  // Execution queue
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private readonly PER_PROVIDER_TIMEOUT_MS = 15000; // 15s per provider attempt

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    try {
      const providersList = ProviderFactory.getRegisteredProviders();
      aiLogger.info('AIRouter', `Default providers registered: ${providersList.join(', ')}`);
    } catch (e) {
      aiLogger.error('AIRouter', 'Failed to register default providers', e);
    }
  }

  private getProviderInstance(id: string): AIProvider | undefined {
    let provider = this.providers.get(id);
    if (!provider) {
      try {
        const registered = ProviderFactory.getRegisteredProviders();
        if (registered.includes(id)) {
          provider = ProviderFactory.create(id);
          this.providers.set(id, provider);
          aiLogger.info('AIRouter', `Lazily initialized provider instance: ${id}`);
        }
      } catch (e) {
        aiLogger.error('AIRouter', `Failed to lazily initialize provider: ${id}`, e);
      }
    }
    return provider;
  }

  public registerProvider(id: string, provider: AIProvider, isPrimary = false, isSecondary = false) {
    this.providers.set(id, provider);
    if (isPrimary) this.primaryProviderId = id;
    if (isSecondary && !this.fallbackProviderIds.includes(id)) this.fallbackProviderIds.push(id);
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.getProviderInstance(id);
  }

  public setPrimaryProvider(id: string) {
    const registered = [...new Set([...ProviderFactory.getRegisteredProviders(), ...this.providers.keys()])];
    if (registered.includes(id)) {
      this.primaryProviderId = id;
      aiLogger.info('AIRouter', `Primary provider set to: ${id}`);
    } else {
      throw new Error(`[AIRouter] Provider with ID "${id}" is not registered.`);
    }
  }

  public getPrimaryProviderId(): string {
    return this.primaryProviderId;
  }

  public getLastUsedModel(): string {
    return this.lastUsedModel;
  }

  public getActiveProvider(): AIProvider {
    return this.getProviderInstance(this.primaryProviderId) || this.getProviderInstance('gemini')!;
  }

  private processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    (async () => {
      while (this.requestQueue.length > 0) {
        const task = this.requestQueue.shift();
        if (task) {
          try { await task(); }
          catch (e) { aiLogger.error('AIRouter', 'Queue task execution failed', e); }
        }
      }
      this.isProcessingQueue = false;
    })();
  }

  public classifyPrompt(prompt: string): PromptTier {
    const words = prompt.trim().split(/\s+/).length;
    const COMPLEX = /\b(code|implement|write|build|create|analyze|explain|debug|review|refactor|architect|algorithm|system|design|comprehensive|detailed|step.by.step|compare|calculate|generate|plan|strategy|research|summarize|translate|fix|test|optimize|model)\b/i;

    if (words <= 12 && !COMPLEX.test(prompt)) return 'fast';
    if (words > 80 || COMPLEX.test(prompt))   return 'complex';
    return 'default';
  }

  public async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<string> {
    const requestKey = this.getRequestKey(prompt, options?.history);

    // Deduplication check
    if (this.inFlightRequests.has(requestKey)) {
      console.log(`[AIRouter] Deduplicating in-flight request: "${requestKey}"`);
      const inFlightPromise = this.inFlightRequests.get(requestKey)!;
      if (onChunk) {
        inFlightPromise.then((text) => onChunk(text)).catch(() => {});
      }
      return inFlightPromise;
    }

    console.log(`[AIRouter] InFlight Lock Created: "${requestKey}"`);

    const requestPromise = new Promise<string>((resolve, reject) => {
      this.requestQueue.push(async () => {
        aiEventEmitter.emit(AIEvents.AI_REQUEST_STARTED, { prompt, options });
        try {
          const response = await this.executeWithRetryAndFallback(prompt, onChunk, options);
          aiEventEmitter.emit(AIEvents.AI_RESPONSE_COMPLETED, { response });
          resolve(response);
        } catch (error) {
          aiEventEmitter.emit(AIEvents.AI_ERROR, { error });
          reject(error);
        }
      });
      this.processQueue();
    }).finally(() => {
      console.log(`[AIRouter] InFlight Lock Released: "${requestKey}"`);
      this.inFlightRequests.delete(requestKey);
    });

    this.inFlightRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  public async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<void> {
    const requestKey = `stream_${this.getRequestKey(prompt, options?.history)}`;

    if (this.inFlightRequests.has(requestKey)) {
      console.log(`[AIRouter] Deduplicating in-flight stream: "${requestKey}"`);
      await this.inFlightRequests.get(requestKey);
      return;
    }

    console.log(`[AIRouter] InFlight Lock Created: "${requestKey}"`);

    const requestPromise = new Promise<string>((resolve, reject) => {
      this.requestQueue.push(async () => {
        aiEventEmitter.emit(AIEvents.AI_STREAM_STARTED, { prompt, options });
        try {
          let accumulated = '';
          await this.executeStreamWithRetryAndFallback(prompt, (chunk) => {
            accumulated += chunk;
            onChunk(chunk);
          }, options);
          aiEventEmitter.emit(AIEvents.AI_STREAM_FINISHED);
          resolve(accumulated);
        } catch (error) {
          aiEventEmitter.emit(AIEvents.AI_ERROR, { error });
          reject(error);
        }
      });
      this.processQueue();
    }).finally(() => {
      console.log(`[AIRouter] InFlight Lock Released: "${requestKey}"`);
      this.inFlightRequests.delete(requestKey);
    });

    this.inFlightRequests.set(requestKey, requestPromise);
    await requestPromise;
  }

  public cancel() {
    for (const provider of this.providers.values()) {
      try {
        provider.cancel();
      } catch (e) {
        aiLogger.error('AIRouter', 'Failed to cancel provider execution', e);
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, providerId: string): Promise<T> {
    console.log(`[AIRouter] Timeout Started: ${timeoutMs}ms for ${providerId}`);
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: Timeout after ${timeoutMs / 1000}s)`);
        reject(new Error(`Provider ${providerId} timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      promise
        .then((res) => {
          clearTimeout(timer);
          console.log(`[AIRouter] Timeout Cancelled for ${providerId}`);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private async executeWithRetryAndFallback(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<string> {
    const providersToTry = this.getProvidersToTry(options?.providerId);
    const promptTier = this.classifyPrompt(prompt);
    let firstAttemptedError: any;

    for (let i = 0; i < providersToTry.length; i++) {
      const providerId = providersToTry[i];
      console.log(`[AIRouter] Provider Selected: ${providerId}`);

      const provider = this.getProviderInstance(providerId);
      if (!provider) {
        console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: Not registered)`);
        continue;
      }

      if (providerId === 'ollama' || providerId === 'local') {
        const isHealthy = await provider.healthCheck();
        if (!isHealthy) {
          aiHealthManager.recordError(providerId, 'Connection Refused / Offline', 'OFFLINE');
          console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: Connection Refused / Offline)`);
          const nextId = providersToTry[i + 1];
          if (nextId) console.log(`[AIRouter] Retrying Provider: ${nextId}`);
          continue;
        }
      }

      // Map prompt & tier into provider-compatible model
      const { mappedModel, originalModel } = providerModelMapper.resolveModelForProvider(
        providerId,
        promptTier,
        options?.model
      );

      const identityDirectives = identitySettings.getFormattedSystemInstructions();
      const combinedContext = options?.context
        ? `${identityDirectives}\n\n${options.context}`
        : identityDirectives;

      const providerOptions: ProviderRequestOptions = {
        ...options,
        context: combinedContext,
        model: mappedModel,
      };

      console.log(`[AIRouter] Logical Model / Tier: ${promptTier} (${originalModel || options?.model || 'auto'})`);
      console.log(`[AIRouter] Target Provider: ${providerId}`);
      console.log(`[AIRouter] Mapped Provider Model: ${mappedModel}`);
      console.log(`[AIRouter] Final Request Payload Model: ${mappedModel}`);

      const startTime = Date.now();
      console.log(`[AIRouter] Provider Started: ${providerId}`);

      try {
        let result: string;
        if (onChunk) {
          let accumulated = '';
          await this.withTimeout(
            provider.generateStream(prompt, (chunk) => {
              accumulated += chunk;
              onChunk(accumulated);
            }, providerOptions),
            this.PER_PROVIDER_TIMEOUT_MS,
            providerId
          );
          result = accumulated;
        } else {
          result = await this.withTimeout(
            provider.generateResponse(prompt, undefined, providerOptions),
            this.PER_PROVIDER_TIMEOUT_MS,
            providerId
          );
        }

        const latencyMs = Date.now() - startTime;
        aiHealthManager.recordSuccess(providerId, latencyMs);

        this.lastUsedModel = mappedModel;
        console.log(`[AIRouter] Provider Succeeded: ${providerId}`);
        console.log(`[AIRouter] Conversation Returned`);
        return result;
      } catch (error: any) {
        if (!firstAttemptedError) {
          firstAttemptedError = error;
        }

        const errStatus = aiHealthManager.recordError(providerId, error);
        const reasonStr = error?.status === 429 || errStatus === 'QUOTA_EXCEEDED' 
          ? '429 Quota Exceeded' 
          : (error?.status === 404 ? '404 Not Found' : (error?.message || String(error)));

        console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: ${reasonStr})`);

        const nextProviderId = providersToTry[i + 1];
        if (nextProviderId) {
          console.log(`[AIRouter] Retrying Provider: ${nextProviderId}`);

          if (aiHealthManager.isAutoFailoverEnabled()) {
            const failedName = aiHealthManager.getProviderName(providerId);
            const nextName = aiHealthManager.getProviderName(nextProviderId);

            aiHealthManager.logFailover(providerId, errStatus, nextProviderId, true);

            notificationManager.showNotification(
              'info',
              'AI Provider Switch',
              `${failedName} ${errStatus === 'QUOTA_EXCEEDED' ? 'quota reached' : 'unavailable'}. Switched to ${nextName}.`
            );
          }
        }
      }
    }

    console.log('[AIRouter] All AI providers failed. Returning AIProviderUnavailable error immediately.');
    throw ErrorManager.createError('AIRouter', 'AIProviderUnavailable: No AI provider is currently available.', 503);
  }

  private async executeStreamWithRetryAndFallback(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<void> {
    const providersToTry = this.getProvidersToTry(options?.providerId);
    const promptTier = this.classifyPrompt(prompt);
    let firstAttemptedError: any;

    for (let i = 0; i < providersToTry.length; i++) {
      const providerId = providersToTry[i];
      console.log(`[AIRouter] Provider Selected: ${providerId}`);

      const provider = this.getProviderInstance(providerId);
      if (!provider) {
        console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: Not registered)`);
        continue;
      }

      if (providerId === 'ollama' || providerId === 'local') {
        const isHealthy = await provider.healthCheck();
        if (!isHealthy) {
          aiHealthManager.recordError(providerId, 'Connection Refused / Offline', 'OFFLINE');
          console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: Connection Refused / Offline)`);
          const nextId = providersToTry[i + 1];
          if (nextId) console.log(`[AIRouter] Retrying Provider: ${nextId}`);
          continue;
        }
      }

      // Map prompt & tier into provider-compatible model
      const { mappedModel, originalModel } = providerModelMapper.resolveModelForProvider(
        providerId,
        promptTier,
        options?.model
      );

      const identityDirectives = identitySettings.getFormattedSystemInstructions();
      const combinedContext = options?.context
        ? `${identityDirectives}\n\n${options.context}`
        : identityDirectives;

      const providerOptions: ProviderRequestOptions = {
        ...options,
        context: combinedContext,
        model: mappedModel,
      };

      console.log(`[AIRouter] Logical Model / Tier: ${promptTier} (${originalModel || options?.model || 'auto'})`);
      console.log(`[AIRouter] Target Provider: ${providerId}`);
      console.log(`[AIRouter] Mapped Provider Model: ${mappedModel}`);
      console.log(`[AIRouter] Final Request Payload Model: ${mappedModel}`);

      const startTime = Date.now();
      let hasEmittedTokens = false;
      console.log(`[AIRouter] Provider Started: ${providerId}`);

      try {
        await this.withTimeout(
          provider.generateStream(prompt, (chunk) => {
            hasEmittedTokens = true;
            onChunk(chunk);
          }, providerOptions),
          this.PER_PROVIDER_TIMEOUT_MS,
          providerId
        );

        const latencyMs = Date.now() - startTime;
        aiHealthManager.recordSuccess(providerId, latencyMs);
        this.lastUsedModel = mappedModel;
        console.log(`[AIRouter] Provider Succeeded: ${providerId}`);
        console.log(`[AIRouter] Conversation Returned`);
        return;
      } catch (error: any) {
        if (!firstAttemptedError) {
          firstAttemptedError = error;
        }

        const errStatus = aiHealthManager.recordError(providerId, error);
        const reasonStr = error?.status === 429 || errStatus === 'QUOTA_EXCEEDED' 
          ? '429 Quota Exceeded' 
          : (error?.status === 404 ? '404 Not Found' : (error?.message || String(error)));

        console.log(`[AIRouter] Provider Failed: ${providerId} (Reason: ${reasonStr})`);

        const nextProviderId = providersToTry[i + 1];
        if (nextProviderId) {
          console.log(`[AIRouter] Retrying Provider: ${nextProviderId}`);

          if (aiHealthManager.isAutoFailoverEnabled()) {
            const failedName = aiHealthManager.getProviderName(providerId);
            const nextName = aiHealthManager.getProviderName(nextProviderId);

            aiHealthManager.logFailover(providerId, errStatus, nextProviderId, true);

            if (hasEmittedTokens) {
              onChunk(`\n\n*[${failedName} quota reached. Continuing with ${nextName}...]*\n\n`);
            }

            notificationManager.showNotification(
              'info',
              'AI Provider Switch',
              `${failedName} ${errStatus === 'QUOTA_EXCEEDED' ? 'quota reached' : 'unavailable'}. Switched to ${nextName}.`
            );
          }
        }
      }
    }

    console.log('[AIRouter] All AI providers failed. Returning AIProviderUnavailable error immediately.');
    throw ErrorManager.createError('AIRouter', 'AIProviderUnavailable: No AI provider is currently available.', 503);
  }

  private getProvidersToTry(preferredProviderId?: string): string[] {
    const list: string[] = [];
    const registered = [...new Set([...ProviderFactory.getRegisteredProviders(), ...this.providers.keys()])];

    // Priority 1: User's preferred provider if specified and healthy
    if (
      preferredProviderId &&
      registered.includes(preferredProviderId) &&
      this.isProviderConfigured(preferredProviderId) &&
      aiHealthManager.isProviderEnabled(preferredProviderId) &&
      aiHealthManager.isProviderHealthy(preferredProviderId)
    ) {
      list.push(preferredProviderId);
    }

    // Priority 2: Primary provider if configured and healthy
    if (
      this.primaryProviderId &&
      registered.includes(this.primaryProviderId) &&
      this.isProviderConfigured(this.primaryProviderId) &&
      !list.includes(this.primaryProviderId) &&
      aiHealthManager.isProviderEnabled(this.primaryProviderId) &&
      aiHealthManager.isProviderHealthy(this.primaryProviderId)
    ) {
      list.push(this.primaryProviderId);
    }

    // Priority 3: Health manager's configured priority list
    const healthyOrdered = aiHealthManager.getOrderedHealthyProviders();
    for (const id of healthyOrdered) {
      if (registered.includes(id) && this.isProviderConfigured(id) && !list.includes(id) && aiHealthManager.isProviderEnabled(id)) {
        list.push(id);
      }
    }

    // Priority 4: Any remaining configured providers in health manager order
    for (const id of aiHealthManager.getPriorityOrder()) {
      if (registered.includes(id) && this.isProviderConfigured(id) && !list.includes(id) && aiHealthManager.isProviderEnabled(id)) {
        list.push(id);
      }
    }

    // Priority 5: Complete rotation fallback — any remaining registered & configured provider
    for (const id of registered) {
      if (this.isProviderConfigured(id) && !list.includes(id) && aiHealthManager.isProviderEnabled(id)) {
        list.push(id);
      }
    }

    return list;
  }

  private isProviderConfigured(id: string): boolean {
    if (id.startsWith('mock-')) return true;
    switch (id) {
      case 'gemini':
      case 'nvidia':
        return true;
      case 'openai':
        return !!AI_CONFIG.providers.openai.apiKey;
      case 'claude':
        return !!AI_CONFIG.providers.claude.apiKey;
      case 'ollama':
        return !!(AI_CONFIG.providers.ollama as any).enabled;
      default:
        return false;
    }
  }

  private getRequestKey(prompt: string, history?: any[]): string {
    return JSON.stringify({
      prompt,
      historyLength: history?.length || 0,
    });
  }
}

export const aiRouter = new AIRouter();
export const aiProvider = aiRouter.getActiveProvider();
