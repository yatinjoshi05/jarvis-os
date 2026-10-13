import { CustomOpenAICompatibleProvider, CustomProviderConfig } from './CustomOpenAICompatibleProvider';
import { aiRouter } from './AIRouter';
import { aiHealthManager } from './AIProviderHealthManager';

declare const process: any;

class CustomProviderManager {
  private storageKey = 'jarvis_custom_providers';
  private customConfigs: CustomProviderConfig[] = [];
  private activeInstances: Map<string, CustomOpenAICompatibleProvider> = new Map();

  constructor() {
    this.initializeCustomProviders();
  }

  public initializeCustomProviders(): void {
    this.reloadFromStorage();
  }

  public reloadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          this.customConfigs = JSON.parse(data);
          this.customConfigs.forEach((cfg) => {
            if (!this.activeInstances.has(cfg.id)) {
              this.instantiateAndRegister(cfg);
            }
          });
        }
      }
    } catch (err) {
      console.error('[CustomProviderManager] Reload error:', err);
    }
  }

  private instantiateAndRegister(config: CustomProviderConfig): void {
    try {
      const providerInstance = new CustomOpenAICompatibleProvider(config);
      this.activeInstances.set(config.id, providerInstance);

      // Register with AIRouter and AIProviderHealthManager
      aiRouter.registerProvider(config.id, providerInstance, false, true);
      aiHealthManager.registerCustomProvider(config.id, config.name);

      console.log(`[CustomProviderManager] Successfully registered custom provider "${config.name}" (ID: ${config.id}) into AIRouter.`);
    } catch (err) {
      console.error(`[CustomProviderManager] Failed to register custom provider ${config.id}:`, err);
    }
  }

  public getCustomProviders(): CustomProviderConfig[] {
    return [...this.customConfigs];
  }

  public async addCustomProvider(newConfig: {
    name: string;
    baseUrl: string;
    modelName: string;
    providerId?: string;       // pre-computed by caller if key was already saved
    envVarKey?: string;        // pre-computed by caller if key was already saved
    rawApiKey?: string;        // only set if internal Tauri path is used
    customHeaders?: Record<string, string>;
  }): Promise<CustomProviderConfig> {
    const slug = newConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    // Use caller-supplied IDs when the frontend has already saved the key
    // (avoids a different ID being generated here, which would create a mismatch)
    const providerId = newConfig.providerId || `custom_${slug}_${Date.now().toString(36)}`;
    const envVarKey = newConfig.envVarKey || `CUSTOM_PROVIDER_${slug.toUpperCase()}_KEY`;

    // Only do internal key persistence in Tauri (desktop) path where the
    // panel cannot call the backend directly. In the browser/Vite path the
    // panel already called POST /api/keys/save before reaching here.
    if (newConfig.rawApiKey && newConfig.rawApiKey.trim()) {
      const rawKey = newConfig.rawApiKey.trim();

      const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
      if (isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('save_api_key', { providerId, rawKey });
        } catch (_) {}
      }
    }

    // Prepare clean config object — DO NOT store rawApiKey in localStorage
    const config: CustomProviderConfig = {
      id: providerId,
      name: newConfig.name.trim(),
      baseUrl: newConfig.baseUrl.trim(),
      modelName: newConfig.modelName.trim(),
      envVarKey,
      customHeaders: newConfig.customHeaders,
    };

    this.customConfigs = [...this.customConfigs.filter((c) => c.id !== config.id), config];
    this.persistConfigs();
    this.instantiateAndRegister(config);

    return config;
  }

  public removeCustomProvider(id: string): void {
    this.customConfigs = this.customConfigs.filter((c) => c.id !== id);
    this.persistConfigs();
    this.activeInstances.delete(id);
    console.log(`[CustomProviderManager] Removed custom provider: ${id}`);
  }

  private persistConfigs(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.customConfigs));
      }
    } catch (_) {}
  }
}

export const customProviderManager = new CustomProviderManager();
export default customProviderManager;
