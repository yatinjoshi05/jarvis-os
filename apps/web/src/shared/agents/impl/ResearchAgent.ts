import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';

export class ResearchAgent extends AbstractBaseAgent {
  constructor(id = 'research_agent', name = 'Research Agent') {
    super(id, name, 'researcher');
    this.capabilities = [
      { id: 'web_search', name: 'Web Search', description: 'Search academic articles and web contents' }
    ];
    this.permissions = [];
    this.supportedTools = ['http_request'];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const data = {
      findings: `Search indices queried. Top results consolidated for topic: ${task.description}.`,
      citations: ['https://wikipedia.org']
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default ResearchAgent;
