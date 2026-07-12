import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class InvestmentAgent extends AbstractBaseAgent {
  constructor(id = 'investment_agent', name = 'Investment Advisor') {
    super(id, name, 'advisor');
    this.capabilities = [
      { id: 'portfolio_yield', name: 'Portfolio Yield', description: 'Evaluate yield metrics and risk margins' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      yieldReport: `Assets yield assessment generated for workspace ${context.workspaceId}.`,
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
export default InvestmentAgent;
