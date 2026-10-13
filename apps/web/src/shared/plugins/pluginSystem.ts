export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  permissions: string[]
  enabled: boolean
}

class PluginSystem {
  private plugins = new Map<string, PluginManifest>()

  constructor() {
    // Pre-register default core platform plugins
    this.registerPlugin({
      id: 'plugin-git-integration',
      name: 'Git Integration',
      version: '1.2.0',
      description: 'Provides version control operations for missions.',
      author: 'JARVIS Core Team',
      permissions: ['file_system', 'terminal'],
      enabled: true,
    })
    this.registerPlugin({
      id: 'plugin-react-devtools',
      name: 'React DevTools Extension',
      version: '2.0.1',
      description: 'DOM preview inspection & component auditing.',
      author: 'JARVIS Core Team',
      permissions: ['browser_automation'],
      enabled: true,
    })
  }

  public registerPlugin(manifest: PluginManifest): void {
    this.plugins.set(manifest.id, manifest)
  }

  public togglePlugin(id: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(id)
    if (!plugin) return false
    plugin.enabled = enabled
    return true
  }

  public getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values())
  }
}

export const pluginSystem = new PluginSystem()
