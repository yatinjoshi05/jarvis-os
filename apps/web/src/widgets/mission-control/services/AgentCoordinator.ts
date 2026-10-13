import { agentEventBus } from './AgentEventBus';

export type AgentState = 'active' | 'idle' | 'working' | 'paused' | 'offline' | 'error';

export interface AgentDetails {
  id: string;
  name: string;
  role: string;
  currentTask: string;
  cpuUsage: number;
  memoryMb: number;
  uptimeSeconds: number;
  state: AgentState;
  icon: string;
}

export class AgentCoordinatorService {
  private agents: Map<string, AgentDetails> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    const defaultList: AgentDetails[] = [
      {
        id: 'ag-browser',
        name: 'Browser Agent',
        role: 'Universal Web Preview Engine',
        currentTask: 'Rendering localhost:5173 preview frame',
        cpuUsage: 2.4,
        memoryMb: 140,
        uptimeSeconds: 14200,
        state: 'working',
        icon: 'Globe',
      },
      {
        id: 'ag-voice',
        name: 'Voice Agent',
        role: 'Neural Speech Synthesizer',
        currentTask: 'Listening for wake word activation',
        cpuUsage: 1.1,
        memoryMb: 85,
        uptimeSeconds: 14200,
        state: 'working',
        icon: 'Mic',
      },
      {
        id: 'ag-memory',
        name: 'Memory Agent',
        role: 'Knowledge Base Vector Indexer',
        currentTask: 'Indexing project telemetry records',
        cpuUsage: 1.8,
        memoryMb: 210,
        uptimeSeconds: 14200,
        state: 'idle',
        icon: 'Database',
      },
      {
        id: 'ag-vision',
        name: 'Vision Agent',
        role: 'Real-time Camera & UI Inspector',
        currentTask: 'OCR text parsing on active dashboard',
        cpuUsage: 3.2,
        memoryMb: 180,
        uptimeSeconds: 14200,
        state: 'working',
        icon: 'Eye',
      },
      {
        id: 'ag-automation',
        name: 'Automation Agent',
        role: 'Workflow Execution Runner',
        currentTask: 'Executing Coding Mode action chain',
        cpuUsage: 2.1,
        memoryMb: 120,
        uptimeSeconds: 14200,
        state: 'working',
        icon: 'Zap',
      },
      {
        id: 'ag-terminal',
        name: 'Terminal Agent',
        role: 'CLI Command Execution Engine',
        currentTask: 'Monitoring powershell process tunnel',
        cpuUsage: 0.9,
        memoryMb: 95,
        uptimeSeconds: 14200,
        state: 'idle',
        icon: 'Terminal',
      },
      {
        id: 'ag-file',
        name: 'File Agent',
        role: 'Workspace File System Inspector',
        currentTask: 'Watching file modification events',
        cpuUsage: 0.5,
        memoryMb: 75,
        uptimeSeconds: 14200,
        state: 'idle',
        icon: 'Folder',
      },
      {
        id: 'ag-research',
        name: 'Research Agent',
        role: 'ArXiv & Web Intelligence Analyzer',
        currentTask: 'Standing by for search queries',
        cpuUsage: 0.0,
        memoryMb: 60,
        uptimeSeconds: 14200,
        state: 'idle',
        icon: 'Search',
      },
    ];

    defaultList.forEach((a) => this.agents.set(a.id, a));
  }

  public getAgents(): AgentDetails[] {
    return Array.from(this.agents.values());
  }

  public getAgent(id: string): AgentDetails | undefined {
    return this.agents.get(id);
  }

  public startAgent(id: string) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.state = 'active';
      agentEventBus.emit('agent:status_changed', { id, state: 'active' }, id);
    }
  }

  public stopAgent(id: string) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.state = 'offline';
      agentEventBus.emit('agent:status_changed', { id, state: 'offline' }, id);
    }
  }

  public restartAgent(id: string) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.state = 'idle';
      setTimeout(() => {
        agent.state = 'working';
        agentEventBus.emit('agent:status_changed', { id, state: 'working' }, id);
      }, 500);
    }
  }

  public assignTask(id: string, task: string) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.currentTask = task;
      agent.state = 'working';
      agentEventBus.emit('agent:task_assigned', { id, task }, id);
    }
  }
}

export const agentCoordinator = new AgentCoordinatorService();
