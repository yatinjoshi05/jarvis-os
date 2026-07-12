import { Permission } from './interfaces';
import { PermissionDeniedError } from './errors';

export class AgentPermissions {
  private agentId: string;
  private permissions: Permission[];

  constructor(agentId: string, permissions: Permission[] = []) {
    this.agentId = agentId;
    this.permissions = permissions;
  }

  public checkPermission(type: Permission['type'], resource: string, action: string) {
    const granted = this.permissions.some(
      (p) => p.type === type && (p.resource === '*' || p.resource === resource) && (p.action === '*' || p.action === action)
    );

    if (!granted) {
      throw new PermissionDeniedError(this.agentId, `${type}:${resource}`);
    }
  }

  public hasToolPermission(toolId: string): boolean {
    // If agent has * wildcard permission or explicit tool access
    return this.permissions.some(
      (p) => p.type === 'plugin' && (p.resource === '*' || p.resource === toolId)
    );
  }
}
export default AgentPermissions;
