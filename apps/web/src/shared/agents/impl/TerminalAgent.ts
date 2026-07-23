import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import { getBackendApiUrl } from '../../ai/config';

export class TerminalAgent extends AbstractBaseAgent {
  constructor(id = 'terminal_agent', name = 'Terminal Agent') {
    super(id, name, 'system_operator');
    this.capabilities = [
      { id: 'shell_execution', name: 'Shell Execution', description: 'Run secure shell commands in isolated sandbox environment' }
    ];
    this.permissions = [{ id: 'perm_term', type: 'terminal', resource: '*', action: '*' }];
    this.supportedTools = ['execute_command'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const targetCmd = task.description || task.name || 'dir';
    let realExecSuccess = false;
    let exitCode = 1;
    let stdout = '';
    let stderr = '';

    try {
      const url = getBackendApiUrl('/api/system/execute-command');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: targetCmd, cwd: context.workspaceId })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        realExecSuccess = true;
        exitCode = json.exitCode || 0;
        stdout = json.stdout || '';
        stderr = json.stderr || '';
      } else {
        exitCode = json.exitCode || 1;
        stderr = json.error || json.stderr || 'Command execution failed';
      }
    } catch (err: any) {
      stderr = `Terminal execution error: ${err.message}`;
    }

    const data = {
      exitCode,
      stdout,
      stderr,
      isMock: false
    };

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id, isMock: false, realExecSuccess });

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: realExecSuccess,
      data
    };
  }
}
export default TerminalAgent;
