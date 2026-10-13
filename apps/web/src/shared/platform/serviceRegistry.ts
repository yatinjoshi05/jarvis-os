export interface PlatformService {
  id: string
  name: string
  version: string
  initialize(): Promise<void>
  shutdown(): Promise<void>
}

class ServiceRegistry {
  private services = new Map<string, PlatformService>()

  public registerService(service: PlatformService): void {
    if (this.services.has(service.id)) {
      console.warn(`[ServiceRegistry] Overwriting service: ${service.id}`)
    }
    this.services.set(service.id, service)
  }

  public getService<T extends PlatformService>(id: string): T | undefined {
    return this.services.get(id) as T
  }

  public async initializeAll(): Promise<void> {
    for (const service of this.services.values()) {
      try {
        await service.initialize()
      } catch (err) {
        console.error(`[ServiceRegistry] Failed to initialize service ${service.id}:`, err)
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    for (const service of this.services.values()) {
      try {
        await service.shutdown()
      } catch (err) {
        console.error(`[ServiceRegistry] Shutdown error for ${service.id}:`, err)
      }
    }
  }
}

export const serviceRegistry = new ServiceRegistry()

export const featureFlags = {
  enableLLMRouting: true,
  enablePluginSandbox: true,
  enableThreatDetection: true,
  enableDevMode: true,
  enableDesktopNotifications: true,
  enableAutoUpdate: true,
}
