import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import { eventBus } from '../model/eventBus'
import { browserAutomationService } from '../services/browserAutomationService'

export class BrowserAgent extends BaseAgent {
  constructor() {
    super('agent-browser', 'Browser Agent', 'browser', ['browser_automation'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Browser Agent] Executing web automation inspection via BrowserAutomationService...`,
    })

    const result = await browserAutomationService.launchAndNavigate(task.missionId, 'http://localhost:3000')
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: result,
    }
  }
}
