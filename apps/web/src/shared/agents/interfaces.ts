import { AgentState } from './types';

export interface Capability {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  type: 'file' | 'terminal' | 'network' | 'api' | 'plugin';
  resource: string;
  action: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  execute: (args: Record<string, any>) => Promise<any>;
}

export interface ExecutionContext {
  userId: string;
  conversationId: string;
  workspaceId: string;
  variables: Record<string, any>;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedAgentId?: string;
  dependencies: string[]; // Task IDs
  result?: any;
  error?: string;
  retryCount: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentTaskId?: string;
}

export interface AgentResult {
  agentId: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BaseAgent {
  id: string;
  name: string;
  role: string;
  state: AgentState;
  capabilities: Capability[];
  permissions: Permission[];
  supportedTools: string[]; // Tool IDs

  initialize(context: ExecutionContext): Promise<void>;
  execute(task: Task, context: ExecutionContext): Promise<AgentResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;
  dispose(): Promise<void>;
}
