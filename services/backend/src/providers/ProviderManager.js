export class ProviderManager {
  constructor(providers = []) {
    this.providers = new Map(providers.map(provider => [provider.id, provider]));
  }

  async complete(request) {
    const preferred = request.preferredProvider ? this.providers.get(request.preferredProvider) : null;
    const candidates = preferred
      ? [preferred, ...Array.from(this.providers.values()).filter(p => p !== preferred)]
      : Array.from(this.providers.values());

    let lastError;
    for (const provider of candidates.filter(Boolean)) {
      try {
        if (await provider.available(request)) return await provider.complete(request);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('No configured AI provider is available.');
  }
}
