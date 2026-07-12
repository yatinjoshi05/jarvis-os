import { BaseError } from '../errors/BaseError';

export class DashboardError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'DashboardError';
  }
}

export class WidgetNotFoundError extends DashboardError {
  constructor(widgetId: string, context?: Record<string, unknown>) {
    super(`Widget with ID "${widgetId}" was not found.`, context);
    this.name = 'WidgetNotFoundError';
  }
}

export class InvalidWorkspaceError extends DashboardError {
  constructor(workspaceId: string, context?: Record<string, unknown>) {
    super(`Workspace with ID "${workspaceId}" is invalid or does not exist.`, context);
    this.name = 'InvalidWorkspaceError';
  }
}

export class NavigationError extends DashboardError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'NavigationError';
  }
}

export class DashboardConfigError extends DashboardError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'DashboardConfigError';
  }
}
