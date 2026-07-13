import { BaseError } from '../../shared/errors/BaseError';

export class AutomationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'AutomationError';
  }
}

export class ProviderUnavailableError extends AutomationError {
  constructor(providerName: string, reason: string, context?: Record<string, unknown>) {
    super(`Provider "${providerName}" is unavailable: ${reason}`, context);
    this.name = 'ProviderUnavailableError';
  }
}

export class InvalidWorkflowError extends AutomationError {
  constructor(workflowId: string, reason: string, context?: Record<string, unknown>) {
    super(`Workflow "${workflowId}" is invalid: ${reason}`, context);
    this.name = 'InvalidWorkflowError';
  }
}

export class FailedJobError extends AutomationError {
  constructor(jobId: string, reason: string, context?: Record<string, unknown>) {
    super(`Job "${jobId}" failed execution: ${reason}`, context);
    this.name = 'FailedJobError';
  }
}

export class TimeoutError extends AutomationError {
  constructor(jobId: string, timeoutMs: number, context?: Record<string, unknown>) {
    super(`Job "${jobId}" execution timed out after ${timeoutMs}ms.`, context);
    this.name = 'TimeoutError';
  }
}

export class WebhookFailureError extends AutomationError {
  constructor(webhookId: string, reason: string, context?: Record<string, unknown>) {
    super(`Webhook "${webhookId}" delivery failure: ${reason}`, context);
    this.name = 'WebhookFailureError';
  }
}

export class QueueOverflowError extends AutomationError {
  constructor(queueType: string, limit: number, context?: Record<string, unknown>) {
    super(`Queue "${queueType}" capacity limit of ${limit} has been reached.`, context);
    this.name = 'QueueOverflowError';
  }
}

export class TemplateError extends AutomationError {
  constructor(templateId: string, reason: string, context?: Record<string, unknown>) {
    super(`Template "${templateId}" interpolation error: ${reason}`, context);
    this.name = 'TemplateError';
  }
}
