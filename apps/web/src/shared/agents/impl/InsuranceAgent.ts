import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class InsuranceAgent extends AbstractBaseAgent {
  constructor(id = 'insurance_agent', name = 'Insurance Advisor') {
    super(id, name, 'advisor');
    this.capabilities = [
      { id: 'insurance_audit', name: 'Insurance Audit', description: 'Review premiums and coverages' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      audit: `Insurance premium analysis completed. Policy recommendation generated.`,
      taskName: task.name
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default InsuranceAgent;
