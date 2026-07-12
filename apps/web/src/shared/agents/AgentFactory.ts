import { AbstractBaseAgent } from './BaseAgent';

type AgentConstructor = new (id: string, name: string) => AbstractBaseAgent;

class AgentFactory {
  private registry = new Map<string, AgentConstructor>();

  public registerType(type: string, constructor: AgentConstructor) {
    this.registry.set(type, constructor);
  }

  public createAgent(type: string, id: string, name: string): AbstractBaseAgent {
    const Constructor = this.registry.get(type);
    if (!Constructor) {
      throw new Error(`[AgentFactory] Agent type "${type}" is not registered.`);
    }

    return new Constructor(id, name);
  }
}

export const agentFactory = new AgentFactory();
export default agentFactory;
