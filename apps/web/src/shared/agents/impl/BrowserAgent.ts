import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import { getBackendApiUrl } from '../../ai/config';

export class BrowserAgent extends AbstractBaseAgent {
  constructor(id = 'browser_agent', name = 'Browser Agent') {
    super(id, name, 'browser_executor');
    this.capabilities = [
      { id: 'web_automation', name: 'Web Automation', description: 'Interact with web apps, fill forms, and scrape data' }
    ];
    this.permissions = [{ id: 'perm_net', type: 'network', resource: '*', action: '*' }];
    this.supportedTools = ['http_request', 'browser_preview'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    let realBrowserSuccess = false;
    let htmlContent = '';
    let targetUrl = 'https://google.com';

    try {
      const url = getBackendApiUrl('/api/system/browser-preview');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        realBrowserSuccess = true;
        htmlContent = json.message || `Successfully launched Chrome preview for ${targetUrl}`;
      } else {
        htmlContent = `Browser launch failed: ${json.error || 'Unknown error'}`;
      }
    } catch (err: any) {
      htmlContent = `Browser action error: ${err.message}`;
    }

    const data = {
      targetUrl,
      htmlContent,
      isMock: false
    };

    agentLogger.log(this.id, 'task_completed', 'info', { taskId: task.id, isMock: false, realBrowserSuccess });

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: realBrowserSuccess,
      data
    };
  }
}
export default BrowserAgent;
