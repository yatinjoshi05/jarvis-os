class ServiceRegistry {
  private services = new Map<string, any>();

  /**
   * Registers a service instance under a unique string key.
   */
  public register(name: string, service: any) {
    if (this.services.has(name)) {
      console.warn(`[ServiceRegistry] Service "${name}" is already registered. Overwriting.`);
    }
    this.services.set(name, service);
  }

  /**
   * Resolves a registered service instance generically.
   */
  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`[ServiceRegistry] Service "${name}" is not registered.`);
    }
    return service as T;
  }
}

export const serviceRegistry = new ServiceRegistry();
export default serviceRegistry;
