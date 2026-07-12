import { BaseError } from '../errors/BaseError';

export class AgentError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'AgentError';
  }
}

export class AgentUnavailableError extends AgentError {
  constructor(agentId: string, context?: Record<string, unknown>) {
    super(`Agent "${agentId}" is unavailable or disabled.`, context);
    this.name = 'AgentUnavailableError';
  }
}

export class TaskFailedError extends AgentError {
  constructor(taskId: string, reason: string, context?: Record<string, unknown>) {
    super(`Task "${taskId}" failed: ${reason}`, context);
    this.name = 'TaskFailedError';
  }
}

export class WorkflowFailedError extends AgentError {
  constructor(workflowId: string, reason: string, context?: Record<string, unknown>) {
    super(`Workflow "${workflowId}" failed: ${reason}`, context);
    this.name = 'WorkflowFailedError';
  }
}

export class PermissionDeniedError extends AgentError {
  constructor(agentId: string, resource: string, context?: Record<string, unknown>) {
    super(`Permission denied for Agent "${agentId}" to access "${resource}".`, context);
    this.name = 'PermissionDeniedError';
  }
}

export class ToolUnavailableError extends AgentError {
  constructor(toolId: string, context?: Record<string, unknown>) {
    super(`Tool "${toolId}" is not registered or unavailable.`, context);
    this.name = 'ToolUnavailableError';
  }
}

export class TimeoutError extends AgentError {
  constructor(actionName: string, durationMs: number, context?: Record<string, unknown>) {
    super(`Action "${actionName}" timed out after ${durationMs}ms.`, context);
    this.name = 'TimeoutError';
  }
}
