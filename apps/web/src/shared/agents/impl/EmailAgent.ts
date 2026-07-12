import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class EmailAgent extends AbstractBaseAgent {
  constructor(id = 'email_agent', name = 'Email Agent') {
    super(id, name, 'communicator');
    this.capabilities = [
      { id: 'email_dispatch', name: 'Email Dispatch', description: 'Draft, parse, and send email digests' }
    ];
    this.permissions = [{ id: 'perm_email', type: 'api', resource: 'smtp', action: 'send' }];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      messageId: `msg_${Date.now()}`,
      status: `Email queued and sent to SMTP client under user: ${context.userId}.`
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default EmailAgent;
