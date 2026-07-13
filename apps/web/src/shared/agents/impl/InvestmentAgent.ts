import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import type { FinancialManager } from '../../../entities/financial/FinancialManager';
import { serviceRegistry } from '../../providers';

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

    const financialManager = serviceRegistry.get<FinancialManager>('financialManager');
    const userId = context.userId || 'usr_guest';
    let yieldReport = '';

    try {
      const investments = financialManager.getInvestments(userId);
      const summary = financialManager.getPortfolioSummary(userId);
      const allocation = financialManager.getAssetAllocation(userId);

      yieldReport = `Portfolio Yield Assessment:\n` +
        `- Total Invested Assets: $${summary.totalValuation.toLocaleString()}\n` +
        `- Active Investments count: ${investments.length}\n` +
        `- Portfolio Cash Reserves: $${summary.cashBalance.toLocaleString()}\n` +
        `- Net returns value: $${summary.totalReturns.toLocaleString()} (${summary.returnsPercentage.toFixed(1)}%)\n` +
        `- Equity: ${allocation.equity.toFixed(1)}%, Fixed Income: ${allocation.debt.toFixed(1)}%, Gold: ${allocation.gold.toFixed(1)}%, Cash: ${allocation.cash.toFixed(1)}%`;
    } catch (e: any) {
      yieldReport = `Assets yield assessment failed: ${e.message}`;
    }

    const data = {
      yieldReport,
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
