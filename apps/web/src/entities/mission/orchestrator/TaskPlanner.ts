import type { AgentCapability } from '../agents/IAgent'
import { agentRegistry } from '../agents/AgentRegistry'
import { ExecutionGraph, type ExecutionNode } from './ExecutionGraph'
import type { MissionStage } from '../model/types'

export interface TaskPlannerResult {
  stages: MissionStage[]
  graph: ExecutionGraph
  estimatedMinutes: number
}

export class TaskPlanner {
  /**
   * Plans a mission goal, decomposing it into stages and building an Execution DAG.
   */
  public async planMission(missionId: string, goalPrompt: string): Promise<TaskPlannerResult> {
    const planningAgent = agentRegistry.findAgentByCapability('planning')
    if (!planningAgent) {
      throw new Error('[TaskPlanner] Planning Agent not found in AgentRegistry.')
    }

    const planResult = await planningAgent.execute({
      id: `task-plan-${Date.now()}`,
      missionId,
      stageId: 's1',
      name: goalPrompt,
      description: 'Decompose mission goal into execution stages and DAG graph',
    })

    const stages: MissionStage[] = (planResult.data as any)?.stages || []
    const graph = new ExecutionGraph()

    // Map stages into DAG nodes
    const stageCapabilities: AgentCapability[] = [
      'planning',
      'code_generation',
      'file_system',
      'code_generation',
      'terminal_execution',
      'verification',
      'browser_automation',
      'verification',
      'planning',
    ]

    let previousNodeId: string | null = null

    stages.forEach((stage, idx) => {
      const nodeId = `node-${stage.id}`
      const requiredCap = stageCapabilities[idx] || 'code_generation'

      const node: ExecutionNode = {
        id: nodeId,
        stageId: stage.id,
        name: stage.name,
        description: stage.description,
        dependencies: previousNodeId ? [previousNodeId] : [],
        status: idx === 0 ? 'completed' : 'pending',
        requiredCapability: requiredCap,
        retryCount: 0,
      }

      graph.addNode(node)
      previousNodeId = nodeId
    })

    return {
      stages,
      graph,
      estimatedMinutes: (planResult.data as any)?.estimatedMinutes || 12,
    }
  }
}

export const taskPlanner = new TaskPlanner()
