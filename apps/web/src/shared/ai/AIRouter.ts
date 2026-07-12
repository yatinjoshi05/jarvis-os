import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { ProviderFactory } from "./ProviderFactory";
import { retryManager } from "./RetryManager";
import { aiLogger } from "./Logger";
import { aiEventEmitter, AIEvents } from "./AIEvents";

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProviderId = 'gemini';
  private secondaryProviderId = 'openai';

  // Deduplication cache
  private inFlightRequests: Map<string, Promise<string>> = new Map();

  // Execution queue
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    try {
      const providersList = ProviderFactory.getRegisteredProviders();
      for (const id of providersList) {
        this.providers.set(id, ProviderFactory.create(id));
      }
      aiLogger.info('AIRouter', `Default providers registered: ${providersList.join(', ')}`);
    } catch (e) {
      aiLogger.error('AIRouter', 'Failed to register default providers', e);
    }
  }

  public registerProvider(id: string, provider: AIProvider, isPrimary = false, isSecondary = false) {
    this.providers.set(id, provider);
    if (isPrimary) this.primaryProviderId = id;
    if (isSecondary) this.secondaryProviderId = id;
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public setPrimaryProvider(id: string) {
    if (this.providers.has(id)) {
      this.primaryProviderId = id;
      aiLogger.info('AIRouter', `Primary provider set to: ${id}`);
    } else {
      throw new Error(`[AIRouter] Provider with ID "${id}" is not registered.`);
    }
  }

  public getPrimaryProviderId(): string {
    return this.primaryProviderId;
  }

  public getActiveProvider(): AIProvider {
    return this.providers.get(this.primaryProviderId) || this.providers.get('gemini')!;
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          aiLogger.error('AIRouter', 'Queue task execution failed', e);
        }
      }
    }
    this.isProcessingQueue = false;
  }

  public async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<string> {
    const requestKey = this.getRequestKey(prompt, options?.history);

    // Deduplication
    if (this.inFlightRequests.has(requestKey)) {
      aiLogger.info('AIRouter', 'Deduplicating in-flight request');
      const inFlightPromise = this.inFlightRequests.get(requestKey)!;
      if (onChunk) {
        inFlightPromise.then((text) => onChunk(text));
      }
      return inFlightPromise;
    }

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
        } finally {
          this.inFlightRequests.delete(requestKey);
        }
      });
      this.processQueue();
    });

    this.inFlightRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  public async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.requestQueue.push(async () => {
        aiEventEmitter.emit(AIEvents.AI_STREAM_STARTED, { prompt, options });
        try {
          await this.executeStreamWithRetryAndFallback(prompt, onChunk, options);
          aiEventEmitter.emit(AIEvents.AI_STREAM_FINISHED);
          resolve();
        } catch (error) {
          aiEventEmitter.emit(AIEvents.AI_ERROR, { error });
          reject(error);
        }
      });
      this.processQueue();
    });
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

  private async executeWithRetryAndFallback(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<string> {
    const providersToTry = this.getProvidersToTry(options?.providerId);
    let lastError: any;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        aiLogger.info('AIRouter', `Attempting generateResponse with provider: ${providerId}`);
        return await retryManager.execute(() => provider.generateResponse(prompt, onChunk, options));
      } catch (error) {
        lastError = error;
        aiLogger.warn('AIRouter', `Provider ${providerId} failed, trying fallback. Error:`, error);
      }
    }

    throw lastError || new Error('[AIRouter] All providers failed or were unavailable.');
  }

  private async executeStreamWithRetryAndFallback(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions & { providerId?: string }
  ): Promise<void> {
    const providersToTry = this.getProvidersToTry(options?.providerId);
    let lastError: any;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        aiLogger.info('AIRouter', `Attempting generateStream with provider: ${providerId}`);
        await retryManager.execute(() => provider.generateStream(prompt, onChunk, options));
        return;
      } catch (error) {
        lastError = error;
        aiLogger.warn('AIRouter', `Provider ${providerId} failed stream, trying fallback. Error:`, error);
      }
    }

    throw lastError || new Error('[AIRouter] All providers failed or were unavailable for streaming.');
  }

  private getProvidersToTry(preferredProviderId?: string): string[] {
    const list: string[] = [];
    if (preferredProviderId && this.providers.has(preferredProviderId)) {
      list.push(preferredProviderId);
    }
    if (this.primaryProviderId && !list.includes(this.primaryProviderId)) {
      list.push(this.primaryProviderId);
    }
    if (this.secondaryProviderId && !list.includes(this.secondaryProviderId)) {
      list.push(this.secondaryProviderId);
    }
    // Fallback to any remaining active providers
    for (const id of this.providers.keys()) {
      if (!list.includes(id)) {
        list.push(id);
      }
    }
    return list;
  }

  private getRequestKey(prompt: string, history?: any[]): string {
    return JSON.stringify({
      prompt,
      historyLength: history?.length || 0,
    });
  }
}

export const aiRouter = new AIRouter();
export const aiProvider = aiRouter.getActiveProvider(); // Keep backwards-compatible singleton export if needed
