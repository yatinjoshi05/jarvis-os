export interface RequestPayload {
  prompt: string;
  context?: string;
  history?: { role: string; content: string }[];
}

export interface ResponsePayload {
  text: string;
}

export interface IAIProvider {
  initialize(): Promise<void>;
  generateResponse(input: RequestPayload): Promise<ResponsePayload>;
  streamResponse(input: RequestPayload, onChunk: (chunk: string) => void): Promise<void>;
  cancel(): void;
  healthCheck(): Promise<boolean>;
  dispose(): void;
}

export class AIRouter {
  private providers: Map<string, IAIProvider> = new Map();
  private primaryProviderId: string = 'gemini';
  private secondaryProviderId: string = 'local';
  
  // Deduplication
  private inFlightRequests: Map<string, Promise<ResponsePayload>> = new Map();
  
  // Queueing
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {}

  public registerProvider(id: string, provider: IAIProvider, isPrimary = false, isSecondary = false) {
    this.providers.set(id, provider);
    if (isPrimary) this.primaryProviderId = id;
    if (isSecondary) this.secondaryProviderId = id;
  }

  public getProvider(id: string): IAIProvider | undefined {
    return this.providers.get(id);
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        await task();
      }
    }
    this.isProcessingQueue = false;
  }

  public async generateResponse(input: RequestPayload, preferredProviderId?: string): Promise<ResponsePayload> {
    const requestKey = this.getRequestKey(input);
    
    // Deduplication
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey)!;
    }

    const requestPromise = new Promise<ResponsePayload>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeWithRetryAndFallback(input, preferredProviderId);
          resolve(response);
        } catch (error) {
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

  public async streamResponse(input: RequestPayload, onChunk: (chunk: string) => void, preferredProviderId?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.executeStreamWithRetryAndFallback(input, onChunk, preferredProviderId);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  
  public cancel() {
      for (const provider of this.providers.values()) {
          provider.cancel();
      }
  }

  private async executeWithRetryAndFallback(input: RequestPayload, preferredProviderId?: string): Promise<ResponsePayload> {
    const providersToTry = this.getProvidersToTry(preferredProviderId);
    
    let lastError: any;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      const isHealthy = await provider.healthCheck();
      if (!isHealthy) continue;

      try {
        // Retry logic inside provider execution: Try up to 3 times
        return await this.retryOperation(() => provider.generateResponse(input), 3);
      } catch (error) {
        lastError = error;
        console.warn(`[AIRouter] Provider ${providerId} failed, falling back. Error:`, error);
      }
    }

    throw lastError || new Error('[AIRouter] All providers failed or were unavailable.');
  }

  private async executeStreamWithRetryAndFallback(input: RequestPayload, onChunk: (chunk: string) => void, preferredProviderId?: string): Promise<void> {
    const providersToTry = this.getProvidersToTry(preferredProviderId);
    let lastError: any;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      const isHealthy = await provider.healthCheck();
      if (!isHealthy) continue;

      try {
        // Stream retry logic: A stream should typically not retry internally after emitting chunks, 
        // as it would duplicate text, but since this is routing we assume provider handles it or it fails early.
        await provider.streamResponse(input, onChunk);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`[AIRouter] Provider ${providerId} failed stream, falling back. Error:`, error);
      }
    }

    throw lastError || new Error('[AIRouter] All providers failed or were unavailable for streaming.');
  }

  private getProvidersToTry(preferredProviderId?: string): string[] {
    const providers: string[] = [];
    if (preferredProviderId && this.providers.has(preferredProviderId)) {
      providers.push(preferredProviderId);
    }
    if (this.primaryProviderId && !providers.includes(this.primaryProviderId)) {
      providers.push(this.primaryProviderId);
    }
    if (this.secondaryProviderId && !providers.includes(this.secondaryProviderId)) {
      providers.push(this.secondaryProviderId);
    }
    return providers;
  }

  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        
        const isTransient = /network|timeout|fetch|connection|429/i.test(String(error?.message || error));
        if (!isTransient) throw error;
        
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 500));
      }
    }
    throw new Error('Unreachable');
  }

  private getRequestKey(input: RequestPayload): string {
    return JSON.stringify({
      prompt: input.prompt,
      historyLength: input.history?.length || 0
    });
  }
}

export const aiRouter = new AIRouter();
