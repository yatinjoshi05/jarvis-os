import { financialManager } from '../entities/financial';

/**
 * Bootstraps and registers core domain entities.
 * Force evaluates self-registering singleton instances to prevent compiler tree-shaking.
 */
export function bootstrap() {
  const instances = {
    financialManager
  };

  if (!instances.financialManager) {
    console.warn('[Bootstrap] financialManager failed to load.');
  }
}
