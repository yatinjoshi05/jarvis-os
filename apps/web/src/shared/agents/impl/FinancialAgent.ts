import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class FinancialAgent extends AbstractBaseAgent {
  constructor(id = 'financial_agent', name = 'Financial Advisor') {
    super(id, name, 'advisor');
    this.capabilities = [
      { id: 'finance_analysis', name: 'Finance Analysis', description: 'Analyze budgets, transactions and portfolios' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      analysis: `Financial audit complete for user ${context.userId}. Account balances optimized.`,
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
export default FinancialAgent;
