import { financialManager } from '../entities/financial';
import { crmManager } from '../entities/crm';
import { automationManager } from '../entities/automation';
import { browserAgentManager } from '../entities/browser';
import { codingAgentManager } from '../entities/coding';

/**
 * Bootstraps and registers core domain entities.
 * Force evaluates self-registering singleton instances to prevent compiler tree-shaking.
 */
export function bootstrap() {
  const instances = {
    financialManager,
    crmManager,
    automationManager,
    browserAgentManager,
    codingAgentManager
  };

  const failed = Object.entries(instances)
    .filter(([_, instance]) => !instance)
    .map(([name]) => name);

  if (failed.length > 0) {
    console.warn(`[Bootstrap] Some managers failed to load: ${failed.join(', ')}`);
  } else {
    console.log('[Bootstrap] All JARVIS OS Core Managers successfully registered.');
  }
}
