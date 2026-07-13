import { AbstractBaseAgent } from '../BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../interfaces';
import { agentLogger } from '../AgentLogger';
import type { FinancialManager } from '../../../entities/financial/FinancialManager';
import { serviceRegistry } from '../../providers';

export class KnowledgeAgent extends AbstractBaseAgent {
  constructor(id = 'knowledge_agent', name = 'Knowledge Agent') {
    super(id, name, 'researcher');
    this.capabilities = [
      { id: 'kb_indexing', name: 'Knowledgebase Indexing', description: 'Index and consolidate long-term knowledge schemas' }
    ];
    this.permissions = [];
    this.supportedTools = [];
  }

  public async execute(task: Task, _context: ExecutionContext): Promise<AgentResult> {
    this.state = 'Running';
    agentLogger.log(this.id, 'execute_task', 'info', { taskId: task.id });

    const financialManager = serviceRegistry.get<FinancialManager>('financialManager');
    const glossary = financialManager.getGlossary();
    const faqs = financialManager.getFAQs();
    const concepts = financialManager.getConcepts();

    const data = {
      indexStatus: 'complete',
      nodesCount: glossary.length + faqs.length + concepts.length,
      taskName: task.name,
      indexedGlossaryTerms: glossary.map((g) => g.term)
    };

    this.state = 'Ready';
    return {
      agentId: this.id,
      success: true,
      data
    };
  }
}
export default KnowledgeAgent;
