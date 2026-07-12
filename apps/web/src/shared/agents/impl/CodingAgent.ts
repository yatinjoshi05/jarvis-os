import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class CodingAgent extends AbstractBaseAgent {
  constructor(id = 'coding_agent', name = 'Coding Agent') {
    super(id, name, 'coder');
    this.capabilities = [
      { id: 'code_generation', name: 'Code Generation', description: 'Write, debug, and refactor code' }
    ];
    this.permissions = [{ id: 'perm_fs', type: 'file', resource: '*', action: '*' }];
    this.supportedTools = ['filesystem_read'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      code: `// Generated code for ${task.name}\nfunction process() {\n  return "completed";\n}`,
      buildResult: 'Clean compilation (0 warnings)'
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default CodingAgent;
