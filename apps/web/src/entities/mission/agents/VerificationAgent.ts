import { BaseAgent, type AgentTask, type AgentResult } from './IAgent'
import { eventBus } from '../model/eventBus'
import { verificationService } from '../services/verificationService'

export class VerificationAgent extends BaseAgent {
  constructor() {
    super('agent-verification', 'Verification Agent', 'verification', ['verification'])
  }

  public async execute(task: AgentTask): Promise<AgentResult> {
    this.status = 'running'
    eventBus.publish('REASONING_STREAM', task.missionId, {
      text: `\n[Verification Agent] Executing automated verification pipeline...`,
    })

    const auditResult = await verificationService.runFullAudit(task.missionId)
    this.status = 'completed'

    return {
      taskId: task.id,
      success: true,
      data: auditResult,
    }
  }
}
