import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentRegistry } from '../AgentRegistry';
import { agentLogger } from '../AgentLogger';
import { autonomySafetyManager } from '../safety/AutonomySafetyManager';

export interface AgentHealthStatus {
  agentId: string;
  name: string;
  state: string;
  isHealthy: boolean;
  issueDescription?: string;
  capabilitiesCount: number;
}

export class SupervisorAgent extends AbstractBaseAgent {
  constructor(id = 'supervisor_agent', name = 'Supervisor Agent') {
    super(id, name, 'system_supervisor');
    this.capabilities = [
      { id: 'health_monitoring', name: 'Agent Health Monitoring', description: 'Monitor health, error rates, and state of all registered agents' },
      { id: 'auto_fix', name: 'Autonomous Agent Auto-Fix', description: 'Detect and auto-repair broken or errored agents with audit snapshots' },
    ];
    this.permissions = [];
    this.supportedTools = ['agent_registry_access'];
  }

  /**
   * Scans all registered agents and compiles a health report.
   */
  public getHealthReport(): AgentHealthStatus[] {
    const agents = agentRegistry.listAgents();
    return agents.map((agent) => {
      const isHealthy = agent.state !== 'Error' && agent.state !== 'Failed';
      return {
        agentId: agent.id,
        name: agent.name,
        state: agent.state,
        isHealthy,
        issueDescription: isHealthy ? undefined : `Agent "${agent.name}" is in an ${agent.state} state`,
        capabilitiesCount: agent.capabilities.length,
      };
    });
  }

  /**
   * Auto-fixes an errored or degraded agent safely.
   */
  public autoFixAgent(agentId: string, issueDescription?: string): { success: boolean; message: string; snapshotId?: string } {
    if (autonomySafetyManager.isKillSwitchActive()) {
      return { success: false, message: `Kill switch active. Auto-fix for "${agentId}" blocked.` };
    }

    const rateCheck = autonomySafetyManager.checkRateLimit();
    if (!rateCheck.allowed) {
      return { success: false, message: rateCheck.reason || 'Rate limit exceeded.' };
    }

    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      return { success: false, message: `Agent "${agentId}" not found in registry.` };
    }

    // 1. Snapshot Before State
    const beforeState = { id: agent.id, state: agent.state, capabilities: [...agent.capabilities] };
    const snapshotId = autonomySafetyManager.createSnapshot(
      agentId,
      JSON.stringify(beforeState, null, 2),
      `Supervisor auto-fix snapshot for ${agentId}: ${issueDescription || 'State recovery'}`
    );

    // 2. Apply Auto-Fix (Reset state from Error to Ready, restore default capabilities if empty)
    const oldState = agent.state;
    agent.state = 'Ready';
    if (agent.capabilities.length === 0) {
      agent.capabilities.push({ id: `${agentId}_recovery`, name: 'Recovery Capability', description: 'Restored by Supervisor Agent' });
    }

    autonomySafetyManager.recordAutonomousAction();

    // 3. Log Audit Entry
    const afterState = { id: agent.id, state: agent.state, capabilities: [...agent.capabilities] };
    autonomySafetyManager.logAudit({
      actionType: 'SUPERVISOR_AUTO_FIX',
      agentId,
      summary: `Supervisor auto-fixed agent "${agent.name}" (${oldState} → Ready)`,
      reasoning: issueDescription || 'State recovery & capability verification',
      beforeState,
      afterState,
      snapshotId,
    });

    return {
      success: true,
      message: `Successfully auto-fixed agent "${agent.name}". State reset from ${oldState} to Ready.`,
      snapshotId,
    };
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const prompt = (task.description || task.name).toLowerCase();
    const isFixRequest = /\b(fix|repair|auto-fix|recover)\b/i.test(prompt);

    const report = this.getHealthReport();
    const erroredAgents = report.filter((r) => !r.isHealthy);

    let fixResults: string[] = [];

    if (isFixRequest || erroredAgents.length > 0) {
      for (const errored of erroredAgents) {
        const res = this.autoFixAgent(errored.agentId, errored.issueDescription);
        fixResults.push(res.message);
      }
    }

    const reportLines = report.map(
      (r) => `- **${r.name}** (\`${r.agentId}\`): Status = \`${r.state}\` ${r.isHealthy ? '✅' : '❌ Error'}`
    );

    const statusText = `### 🛡️ Supervisor Agent Health Dashboard
**Total Monitored Agents**: ${report.length}
**Healthy Agents**: ${report.length - erroredAgents.length}
**Degraded/Errored Agents**: ${erroredAgents.length}

#### Agent Health Matrix
${reportLines.join('\n')}

${fixResults.length > 0 ? `\n#### 🔧 Autonomous Auto-Fix Summary\n` + fixResults.map((f) => `- ${f}`).join('\n') : ''}`;

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id });
    this.state = 'Ready';

    return {
      agentId: this.id,
      success: true,
      data: {
        analysis: statusText,
        report,
        autoFixCount: fixResults.length,
        isMock: false,
      },
    };
  }
}

export default SupervisorAgent;
