import { BaseAgent as IBaseAgent, Capability, Permission, Task, ExecutionContext, AgentResult } from './interfaces';
import { AgentState } from './types';
import { agentEventEmitter, AgentEvents } from './events';

export abstract class AbstractBaseAgent implements IBaseAgent {
  public id: string;
  public name: string;
  public role: string;
  public state: AgentState = 'Idle';
  public capabilities: Capability[] = [];
  public permissions: Permission[] = [];
  public supportedTools: string[] = [];

  constructor(id: string, name: string, role: string) {
    this.id = id;
    this.name = name;
    this.role = role;
  }

  public async initialize(context: ExecutionContext): Promise<void> {
    this.state = 'Initializing';
    console.log(`[BaseAgent] Initializing agent: ${this.name} (${this.id})`, context);
    this.state = 'Ready';
    agentEventEmitter.emit(AgentEvents.AGENT_STARTED, { agentId: this.id });
  }

  public abstract execute(task: Task, context: ExecutionContext): Promise<AgentResult>;

  public async pause(): Promise<void> {
    this.state = 'Paused';
    agentEventEmitter.emit(AgentEvents.AGENT_PAUSED, { agentId: this.id });
  }

  public async resume(): Promise<void> {
    this.state = 'Running';
    agentEventEmitter.emit(AgentEvents.AGENT_RESUMED, { agentId: this.id });
  }

  public async stop(): Promise<void> {
    this.state = 'Stopped';
    agentEventEmitter.emit(AgentEvents.AGENT_STOPPED, { agentId: this.id });
  }

  public async healthCheck(): Promise<boolean> {
    return this.state === 'Ready' || this.state === 'Running' || this.state === 'Paused';
  }

  public async dispose(): Promise<void> {
    this.state = 'Idle';
  }
}
export default AbstractBaseAgent;
