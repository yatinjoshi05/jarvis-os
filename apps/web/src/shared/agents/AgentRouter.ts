import { Task } from './interfaces';
import { AbstractBaseAgent } from './BaseAgent';
import { agentRegistry } from './AgentRegistry';

class AgentRouter {
  /**
   * Routes a task to the optimal registered agent.
   */
  public route(task: Task): AbstractBaseAgent {
    const agents = agentRegistry.listAgents();

    if (task.assignedAgentId) {
      const explicitAgent = agentRegistry.getAgent(task.assignedAgentId);
      if (explicitAgent) return explicitAgent;
    }

    for (const agent of agents) {
      const match = agent.capabilities.some(
        (cap) => cap.name.toLowerCase() === task.name.toLowerCase() || task.description.toLowerCase().includes(cap.name.toLowerCase())
      );
      if (match) return agent;
    }

    if (agents.length > 0) {
      return agents[0];
    }

    throw new Error(`[AgentRouter] No agent found capable of executing task: "${task.name}".`);
  }
}

export const agentRouter = new AgentRouter();
export default agentRouter;
