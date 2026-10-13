import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import type { MissionStage } from '../model/types'
import { eventBus } from '../model/eventBus'

export interface MissionPlanOutput {
  stages: MissionStage[]
  estimatedMinutes: number
  summary: string
}

export class PlanningAgent extends BaseAgent {
  constructor() {
    super('agent-planning', 'Planning Agent', 'planning', ['planning'])
  }

  public async execute(task: AgentTask): Promise<AgentResult<MissionPlanOutput>> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Planning Agent] Decomposing mission goal: "${task.name}" into execution stages...`,
    })

    // Simulate planning decomposition
    await new Promise((res) => setTimeout(res, 200))

    const generatedStages: MissionStage[] = [
      { id: 's1', name: 'Planning', description: 'Requirements and scope', status: 'completed', progress: 100 },
      { id: 's2', name: 'Architecture', description: 'System design', status: 'in_progress', progress: 20 },
      { id: 's3', name: 'Create files', description: 'Project structure', status: 'pending', progress: 0 },
      { id: 's4', name: 'Coding', description: 'Implementation', status: 'pending', progress: 0 },
      { id: 's5', name: 'Dependencies', description: 'Package preparation', status: 'pending', progress: 0 },
      { id: 's6', name: 'Testing', description: 'Test execution', status: 'pending', progress: 0 },
      { id: 's7', name: 'Preview', description: 'Browser review', status: 'pending', progress: 0 },
      { id: 's8', name: 'Verification', description: 'Validation', status: 'pending', progress: 0 },
      { id: 's9', name: 'Completed', description: 'Mission closure', status: 'pending', progress: 0 },
    ]

    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: {
        stages: generatedStages,
        estimatedMinutes: 12,
        summary: 'Decomposed goal into 9 structured execution stages.',
      },
    }
  }
}
