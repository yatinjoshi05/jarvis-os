import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class BrowserAgent extends AbstractBaseAgent {
  constructor(id = 'browser_agent', name = 'Browser Agent') {
    super(id, name, 'browser_executor');
    this.capabilities = [
      { id: 'web_automation', name: 'Web Automation', description: 'Interact with web apps, fill forms, and scrape data' }
    ];
    this.permissions = [{ id: 'perm_net', type: 'network', resource: '*', action: '*' }];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      screenshot: 'data:image/png;base64,mock',
      htmlContent: `<html>Web scrape results for task ${task.name}</html>`
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default BrowserAgent;
