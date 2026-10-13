import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import { eventBus } from '../model/eventBus'
import { terminalService } from '../services/terminalService'

export class TerminalAgent extends BaseAgent {
  constructor() {
    super('agent-terminal', 'Terminal Agent', 'terminal', ['terminal_execution'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Terminal Agent] Executing terminal command via TerminalService...`,
    })

    const result = await terminalService.executeCommand(task.missionId, 'npm install')
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: result,
    }
  }
}
