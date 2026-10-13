export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed'

export type AgentCapability =
  | 'planning'
  | 'code_generation'
  | 'refactoring'
  | 'terminal_execution'
  | 'browser_automation'
  | 'verification'
  | 'memory_search'
  | 'file_system'
  | 'research'

export interface AgentTask<TPayload = unknown> {
  id: string
  missionId: string
  stageId: string
  name: string
  description: string
  payload?: TPayload
}

export interface AgentResult<TData = unknown> {
  taskId: string
  success: boolean
  data?: TData
  error?: string
  logs?: string[]
}

export interface IAgent {
  id: string
  name: string
  type: string
  status: AgentStatus
  capabilities: AgentCapability[]

  execute(task: AgentTask): Promise<AgentResult>
  pause(): void
  resume(): void
  cancel(): void
  reportProgress(percent: number, message: string): void
  cleanup(): void
}

export abstract class BaseAgent implements IAgent {
  public id: string
  public name: string
  public type: string
  public status: AgentStatus = 'idle'
  public capabilities: AgentCapability[] = []

  constructor(id: string, name: string, type: string, capabilities: AgentCapability[]) {
    this.id = id
    this.name = name
    this.type = type
    this.capabilities = capabilities
  }

  public abstract execute(task: AgentTask): Promise<AgentResult>

  public pause(): void {
    if (this.status === 'running') {
      this.status = 'paused'
    }
  }

  public resume(): void {
    if (this.status === 'paused') {
      this.status = 'running'
    }
  }

  public cancel(): void {
    this.status = 'failed'
  }

  public reportProgress(_percent: number, _message: string): void {
    // Override in derived agents or notify store
  }

  public cleanup(): void {
    this.status = 'idle'
  }
}
