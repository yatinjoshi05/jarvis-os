import { agentRegistry } from '../agents/AgentRegistry'
import { PlanningAgent } from '../agents/PlanningAgent'
import { CodingAgent } from '../agents/CodingAgent'
import { TerminalAgent } from '../agents/TerminalAgent'
import { BrowserAgent } from '../agents/BrowserAgent'
import { VerificationAgent } from '../agents/VerificationAgent'
import { MemoryAgent, ResearchAgent, FileAgent } from '../agents/SupportAgents'
import { taskPlanner } from './TaskPlanner'
import { eventBus } from '../model/eventBus'
import { useMissionStore } from '../model/useMissionStore'
import { missionEngine } from '../services/missionEngine'

class MissionOrchestrator {
  private isInitialized = false

  public initializeFramework(): void {
    if (this.isInitialized) return

    // Register all specialized subagents in AgentRegistry
    agentRegistry.registerAgent(new PlanningAgent())
    agentRegistry.registerAgent(new CodingAgent())
    agentRegistry.registerAgent(new TerminalAgent())
    agentRegistry.registerAgent(new BrowserAgent())
    agentRegistry.registerAgent(new VerificationAgent())
    agentRegistry.registerAgent(new MemoryAgent())
    agentRegistry.registerAgent(new ResearchAgent())
    agentRegistry.registerAgent(new FileAgent())

    this.isInitialized = true
  }

  /**
   * Orchestrates the execution of a mission through the Agent Framework.
   */
  public async executeMission(missionId: string, goalPrompt: string): Promise<void> {
    this.initializeFramework()
    const store = useMissionStore.getState()

    eventBus.publish('MISSION_STARTED', missionId, { goalPrompt })

    // Step 1: Task Planning & DAG Graph Creation
    const plan = await taskPlanner.planMission(missionId, goalPrompt)
    store.updateMetrics({ activeTask: 'Planning mission execution graph...' })

    // Step 2: Loop through DAG nodes and dispatch to agents
    const nodes = plan.graph.getAllNodes()
    for (const node of nodes) {
      if (store.activeMission?.status !== 'running') break

      plan.graph.markInProgress(node.id)
      missionEngine.transitionToStage(node.stageId)
      store.updateInspectorRow('Current task', `Executing ${node.name}`)

      const assignedAgent = agentRegistry.findAgentByCapability(node.requiredCapability)
      if (assignedAgent) {
        eventBus.publish('TASK_ASSIGNED', missionId, {
          taskId: node.id,
          agentId: assignedAgent.id,
          agentName: assignedAgent.name,
        })

        const result = await assignedAgent.execute({
          id: node.id,
          missionId,
          stageId: node.stageId,
          name: node.name,
          description: node.description,
        })

        if (result.success) {
          plan.graph.markCompleted(node.id)
          eventBus.publish('TASK_COMPLETED', missionId, { taskId: node.id })
        } else {
          plan.graph.markFailed(node.id)
          eventBus.publish('TASK_FAILED', missionId, { taskId: node.id, error: result.error })
        }
      }
    }

    eventBus.publish('MISSION_SUMMARY_READY', missionId, {
      completedNodes: nodes.filter((n) => n.status === 'completed').length,
      totalNodes: nodes.length,
    })
  }
}

export const missionOrchestrator = new MissionOrchestrator()
