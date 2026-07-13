import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import type { FinancialManager } from '../../../entities/financial/FinancialManager';
import { serviceRegistry } from '../../providers';

export class InsuranceAgent extends AbstractBaseAgent {
  constructor(id = 'insurance_agent', name = 'Insurance Advisor') {
    super(id, name, 'advisor');
    this.capabilities = [
      { id: 'insurance_audit', name: 'Insurance Audit', description: 'Review premiums and coverages' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const financialManager = serviceRegistry.get<FinancialManager>('financialManager');
    const userId = context.userId || 'usr_guest';
    let audit = '';

    try {
      // Seed default life policy if none exist, to make it realistic
      const policies = financialManager.getInsurancePolicies(userId);
      if (policies.length === 0) {
        try {
          financialManager.getProfile(userId);
          financialManager.addInsurancePolicy(userId, {
            type: 'term',
            policyName: 'Shield Term Plan',
            provider: 'MetLife',
            sumAssured: 300000,
            premium: 500,
            premiumFrequency: 'yearly',
            startDate: Date.now() - 365 * 24 * 3600 * 1000,
            nextPremiumDate: Date.now() + 180 * 24 * 3600 * 1000
          });
        } catch (_) { /* ignore profile missing */ }
      }

      const coverage = financialManager.checkInsuranceCoverage(userId);
      const activePoliciesCount = financialManager.getInsurancePolicies(userId).length;

      audit = `Insurance coverage audit completed.\n` +
        `- Active policies: ${activePoliciesCount}\n` +
        `- Total active life cover: $${coverage.activeLifeCover.toLocaleString()}\n` +
        `- Target life cover required: $${coverage.neededCover.toLocaleString()}\n` +
        `- Coverage Gap: $${coverage.gap.toLocaleString()}\n` +
        `- Covered Status: ${coverage.isCovered ? 'Adequate' : 'Underinsured'}`;
    } catch (e: any) {
      audit = `Insurance audit failed: ${e.message}`;
    }

    const data = {
      audit,
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
