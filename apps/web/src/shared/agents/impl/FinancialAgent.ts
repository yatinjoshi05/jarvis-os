import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import type { FinancialManager } from '../../../entities/financial/FinancialManager';
import { serviceRegistry } from '../../providers';

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

    const financialManager = serviceRegistry.get<FinancialManager>('financialManager');
    const userId = context.userId || 'usr_guest';
    let analysis = '';

    try {
      // Try to load or seed the profile/portfolio
      let profile;
      try {
        profile = financialManager.getProfile(userId);
      } catch (_) {
        profile = financialManager.createProfile(
          userId,
          { fullName: 'Default Agent Guest', occupation: 'Technology consultant', age: 35, dependentsCount: 2 },
          { annualIncome: 150000, monthlyExpenses: 8000, totalAssets: 250000, totalLiabilities: 50000 },
          6,
          'basic'
        );
      }

      const summary = financialManager.getPortfolioSummary(userId);
      const analytics = financialManager.getAnalyticsReport(userId);
      const recommendations = financialManager.generateRecommendation(userId);

      analysis = `Financial audit complete for user ${userId} (${profile.personalInfo.fullName}).\n` +
        `- Net Worth: $${analytics.netWorth.toLocaleString()}\n` +
        `- Cash Balance: $${summary.cashBalance.toLocaleString()}\n` +
        `- Savings Rate: ${analytics.cashFlow.savingsRatePercent.toFixed(1)}%\n` +
        `- Active Goals: ${profile.goals.length}\n` +
        `- Generated Recommendations: ${recommendations.length} items.`;

    } catch (e: any) {
      analysis = `Financial audit failed: ${e.message}`;
    }

    const data = {
      analysis,
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
