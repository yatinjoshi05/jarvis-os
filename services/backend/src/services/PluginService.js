/**
 * PluginService — Public API for Third-Party Plugin Registration & Lifecycle Management
 */
export class PluginService {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Register third-party extension plugin
   */
  async registerPlugin(pluginId, pluginManifest) {
    console.log(`[PluginService] Registering plugin: ${pluginId}`);
    this.plugins.set(pluginId, { manifest: pluginManifest, active: true, registeredAt: Date.now() });
    return { success: true, pluginId };
  }

  /**
   * List all active registered plugins
   */
  async listPlugins() {
    return Array.from(this.plugins.entries()).map(([id, info]) => ({ id, ...info }));
  }
}

export const pluginService = new PluginService();
