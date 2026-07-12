import { MemoryProvider } from './interfaces';
import { LocalStorageProvider, InMemoryProvider } from './StoreProviders';
import { MemoryScope } from './types';
import { memoryLogger } from './Logger';

class MemoryRouter {
  private providers = new Map<string, MemoryProvider>();
  private defaultProviderId = 'local-storage';

  constructor() {
    this.providers.set('local-storage', new LocalStorageProvider());
    this.providers.set('in-memory', new InMemoryProvider());
  }

  public registerProvider(id: string, provider: MemoryProvider) {
    this.providers.set(id, provider);
    memoryLogger.info('Router', `Registered provider: ${id}`);
  }

  public getProvider(scope?: MemoryScope): MemoryProvider {
    // If scope is transient or working, default to in-memory store.
    // If persistent, default to local-storage store.
    if (scope === 'transient' || scope === 'working') {
      return this.providers.get('in-memory')!;
    }

    const provider = this.providers.get(this.defaultProviderId);
    if (!provider) {
      memoryLogger.warn('Router', `Default provider "${this.defaultProviderId}" unavailable, using in-memory store`);
      return this.providers.get('in-memory')!;
    }
    return provider;
  }

  public setDefaultProvider(id: string) {
    if (this.providers.has(id)) {
      this.defaultProviderId = id;
      memoryLogger.info('Router', `Default provider changed to: ${id}`);
    } else {
      throw new Error(`[MemoryRouter] Provider with ID "${id}" is not registered.`);
    }
  }

  public getProviderId(scope?: MemoryScope): string {
    if (scope === 'transient' || scope === 'working') {
      return 'in-memory';
    }
    return this.defaultProviderId;
  }
}

export const memoryRouter = new MemoryRouter();
export default memoryRouter;
