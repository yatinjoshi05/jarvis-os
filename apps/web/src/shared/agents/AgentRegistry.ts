import { AbstractBaseAgent } from './BaseAgent';
import { agentEventEmitter, AgentEvents } from './events';

class AgentRegistry {
  private agents = new Map<string, AbstractBaseAgent>();

  public register(agent: AbstractBaseAgent) {
    if (this.agents.has(agent.id)) {
      throw new Error(`[AgentRegistry] Agent "${agent.id}" is already registered.`);
    }
    this.agents.set(agent.id, agent);
    agentEventEmitter.emit(AgentEvents.AGENT_REGISTERED, agent);
  }

  public unregister(agentId: string) {
    this.agents.delete(agentId);
  }

  public getAgent(agentId: string): AbstractBaseAgent | null {
    return this.agents.get(agentId) || null;
  }

  public listAgents(): AbstractBaseAgent[] {
    return Array.from(this.agents.values());
  }

  public clear() {
    this.agents.clear();
  }
}

export const agentRegistry = new AgentRegistry();
export default agentRegistry;
