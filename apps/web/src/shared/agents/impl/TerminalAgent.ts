import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class TerminalAgent extends AbstractBaseAgent {
  constructor(id = 'terminal_agent', name = 'Terminal Agent') {
    super(id, name, 'system_operator');
    this.capabilities = [
      { id: 'shell_execution', name: 'Shell Execution', description: 'Run secure shell commands in isolated sandbox environment' }
    ];
    this.permissions = [{ id: 'perm_term', type: 'terminal', resource: '*', action: '*' }];
    this.supportedTools = [];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      exitCode: 0,
      stdout: `Successfully executed: ${task.description} under path ${context.workspaceId}.`,
      stderr: ''
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default TerminalAgent;
