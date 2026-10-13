import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import type { FinancialManager } from '../../../entities/financial/FinancialManager';
import { serviceRegistry } from '../../providers';

export class TradingAgent extends AbstractBaseAgent {
  constructor(id = 'trading_agent', name = 'Trading Advisor') {
    super(id, name, 'trading_analyst');
    this.capabilities = [
      { id: 'trading_analysis', name: 'Trading Analysis', description: 'Analyze asset classes, technical indicators, and risk/reward structures' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const userId = context.userId || 'usr_guest';
    let portfolioSummary = 'No local portfolio linked.';

    try {
      const financialManager = serviceRegistry.get<FinancialManager>('financialManager');
      if (financialManager) {
        const summary = financialManager.getPortfolioSummary(userId);
        portfolioSummary = `Local Portfolio Cash Balance: $${summary.cashBalance.toLocaleString()}, Total Asset Valuation: $${summary.totalValuation.toLocaleString()}`;
      }
    } catch (_) {
      // Gracefully continue with default portfolio summary
    }

    const analysis = `Trading & Asset Analysis Framework:\n` +
      `- Focus Topic: ${task.description || task.name}\n` +
      `- Environment Mode: [READ-ONLY ANALYSIS & EDUCATIONAL STRATEGY]\n` +
      `- Market Data Status: Operating on general market concepts, historical principles, and user-provided inputs (Live streaming broker feed not active).\n` +
      `- Risk Context: ${portfolioSummary}\n` +
      `- Strategic Principles: Always define risk/reward margins, utilize stop-loss boundaries, and diversify across uncorrelated asset classes.\n` +
      `- Note on Historical Metrics: Any referenced historical returns or past statistical metrics are strictly backward-looking observations and do NOT constitute a guarantee, prediction, or forecast of future profits.`;

    const data = {
      analysis,
      taskName: task.name,
      executionBlocked: true, // Hard rule: No real trade execution
      marketDataLive: false,
    };

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id });

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}

export default TradingAgent;
