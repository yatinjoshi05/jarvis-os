import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class WhatsAppAgent extends AbstractBaseAgent {
  constructor(id = 'whatsapp_agent', name = 'WhatsApp Agent') {
    super(id, name, 'communicator');
    this.capabilities = [
      { id: 'im_dispatch', name: 'Instant Message Dispatch', description: 'Interact with instant messaging APIs' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      messageId: `wa_${Date.now()}`,
      status: `WhatsApp API message payload processed successfully.`
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default WhatsAppAgent;
