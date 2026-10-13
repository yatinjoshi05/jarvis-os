import type { AgentCapability, AgentStatus, IAgent } from './IAgent'

class AgentRegistry {
  private registry = new Map<string, IAgent>()

  public registerAgent(agent: IAgent): void {
    if (this.registry.has(agent.id)) {
      console.warn(`[AgentRegistry] Overwriting existing agent registration: ${agent.id}`)
    }
    this.registry.set(agent.id, agent)
  }

  public unregisterAgent(agentId: string): boolean {
    return this.registry.delete(agentId)
  }

  public getAgent(agentId: string): IAgent | undefined {
    return this.registry.get(agentId)
  }

  public findAgentByCapability(capability: AgentCapability): IAgent | undefined {
    for (const agent of this.registry.values()) {
      if (agent.capabilities.includes(capability)) {
        return agent
      }
    }
    return undefined
  }

  public findAllAgentsByCapability(capability: AgentCapability): IAgent[] {
    const matched: IAgent[] = []
    for (const agent of this.registry.values()) {
      if (agent.capabilities.includes(capability)) {
        matched.push(agent)
      }
    }
    return matched
  }

  public getAllAgents(): IAgent[] {
    return Array.from(this.registry.values())
  }

  public getHealthStatus(): Record<string, AgentStatus> {
    const health: Record<string, AgentStatus> = {}
    for (const [id, agent] of this.registry.entries()) {
      health[id] = agent.status
    }
    return health
  }

  public clear(): void {
    this.registry.clear()
  }
}

export const agentRegistry = new AgentRegistry()
