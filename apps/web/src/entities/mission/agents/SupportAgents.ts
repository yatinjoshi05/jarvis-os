import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import { eventBus } from '../model/eventBus'

export class MemoryAgent extends BaseAgent {
  constructor() {
    super('agent-memory', 'Memory Agent', 'memory', ['memory_search'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Memory Agent] Querying semantic context memory for: ${task.name}...`,
    })

    await new Promise((res) => setTimeout(res, 150))
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: { relevantMemories: 5 },
    }
  }
}

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('agent-research', 'Research Agent', 'research', ['research'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Research Agent] Synthesizing research data for: ${task.name}...`,
    })

    await new Promise((res) => setTimeout(res, 150))
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: { citations: 3 },
    }
  }
}

export class FileAgent extends BaseAgent {
  constructor() {
    super('agent-file', 'File Agent', 'file_system', ['file_system'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[File Agent] Inspecting directory structure for: ${task.name}...`,
    })

    await new Promise((res) => setTimeout(res, 150))
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: { filesScanned: 24 },
    }
  }
}
