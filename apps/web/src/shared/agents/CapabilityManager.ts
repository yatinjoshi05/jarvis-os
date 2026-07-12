import { AbstractBaseAgent } from './BaseAgent';
import { toolManager } from './ToolManager';

class CapabilityManager {
  /**
   * Validates if the agent is capable of running with its assigned tools.
   */
  public validateCapabilities(agent: AbstractBaseAgent): boolean {
    for (const toolId of agent.supportedTools) {
      try {
        toolManager.getTool(toolId);
      } catch (_) {
        console.warn(`[CapabilityManager] Agent "${agent.id}" requires tool "${toolId}" which is currently unavailable.`);
        return false;
      }
    }
    return true;
  }
}

export const capabilityManager = new CapabilityManager();
export default capabilityManager;
