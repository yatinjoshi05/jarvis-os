import { AbstractBaseAgent } from './BaseAgent';
import { Task, ExecutionContext, AgentResult, Workflow } from './interfaces';
import { agentRegistry } from './AgentRegistry';
import { taskManager } from './TaskManager';
import { workflowManager } from './WorkflowManager';
import { toolManager } from './ToolManager';
import { capabilityManager } from './CapabilityManager';
import { agentLogger } from './AgentLogger';
import { autonomySafetyManager } from './safety/AutonomySafetyManager';
import { selfUpdateManager } from './safety/SelfUpdateManager';
import { agentHubRegistry } from './AgentHubRegistry';

// Import initial agent implementations
import { FinancialAgent } from './impl/FinancialAgent';
import { InsuranceAgent } from './impl/InsuranceAgent';
import { InvestmentAgent } from './impl/InvestmentAgent';
import { BrowserAgent } from './impl/BrowserAgent';
import { CodingAgent } from './impl/CodingAgent';
import { ResearchAgent } from './impl/ResearchAgent';
import { AutomationAgent } from './impl/AutomationAgent';
import { EmailAgent } from './impl/EmailAgent';
import { WhatsAppAgent } from './impl/WhatsAppAgent';
import { KnowledgeAgent } from './impl/KnowledgeAgent';
import { DocumentAgent } from './impl/DocumentAgent';
import { TerminalAgent } from './impl/TerminalAgent';
import { TradingAgent } from './impl/TradingAgent';
import { MetaAgent } from './impl/MetaAgent';
import { SupervisorAgent } from './impl/SupervisorAgent';
import { CallingAgent } from './impl/CallingAgent';

export class AgentManager {
  public registry = agentRegistry;
  public tasks = taskManager;
  public workflows = workflowManager;
  public tools = toolManager;
  public capabilities = capabilityManager;
  public logger = agentLogger;
  public safety = autonomySafetyManager;
  public selfUpdate = selfUpdateManager;

  constructor() {
    this.init();
  }

  private init() {
    // Seed and register initial agents
    this.registerAgent(new FinancialAgent());
    this.registerAgent(new InsuranceAgent());
    this.registerAgent(new InvestmentAgent());
    this.registerAgent(new BrowserAgent());
    this.registerAgent(new CodingAgent());
    this.registerAgent(new ResearchAgent());
    this.registerAgent(new AutomationAgent());
    this.registerAgent(new EmailAgent());
    this.registerAgent(new WhatsAppAgent());
    this.registerAgent(new KnowledgeAgent());
    this.registerAgent(new DocumentAgent());
    this.registerAgent(new TerminalAgent());
    this.registerAgent(new TradingAgent());
    this.registerAgent(new MetaAgent());
    this.registerAgent(new SupervisorAgent());
    this.registerAgent(new CallingAgent());
  }

  // Public coordinator APIs
  public registerAgent(agent: AbstractBaseAgent) {
    this.registry.register(agent);
    // The Agent Hub is the durable management source of truth. Registering a
    // runtime agent here keeps future implementations visible without UI work.
    agentHubRegistry.registerRuntimeAgent(agent);
  }

  public unregisterAgent(agentId: string) {
    this.registry.unregister(agentId);
  }

  public async startAgent(agentId: string, context: ExecutionContext) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found.`);
    await agent.initialize(context);
  }

  public async stopAgent(agentId: string) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found.`);
    await agent.stop();
  }

  public async pauseAgent(agentId: string) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found.`);
    await agent.pause();
  }

  public async resumeAgent(agentId: string) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found.`);
    await agent.resume();
  }

  public async executeTask(taskId: string, context: ExecutionContext): Promise<AgentResult> {
    return this.tasks.executeTask(taskId, context);
  }

  public async executeWorkflow(workflowId: string, context: ExecutionContext, parallel = false): Promise<void> {
    await this.workflows.executeWorkflow(workflowId, context, parallel);
  }

  public getAgent(agentId: string): AbstractBaseAgent | null {
    return this.registry.getAgent(agentId);
  }

  public listAgents(): AbstractBaseAgent[] {
    return this.registry.listAgents();
  }

  public createWorkflow(name: string, description: string): Workflow {
    return this.workflows.createWorkflow(name, description);
  }

  public addTaskToWorkflow(workflowId: string, name: string, description: string, priority?: Task['priority']): Task {
    return this.workflows.addTaskToWorkflow(workflowId, name, description, priority);
  }
}

export const agentManager = new AgentManager();
export default agentManager;
