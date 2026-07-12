import { UserRole, Permission } from './types';
import { auditLogger } from './AuditLogger';
import { authEventEmitter, AuthEvents } from './events';

class SecurityManager {
  private rolePrivileges = new Map<UserRole, Permission[]>();

  constructor() {
    this.initPrivileges();
  }

  private initPrivileges() {
    this.rolePrivileges.set('admin', [
      'read:all',
      'write:all',
      'execute:all',
      'plugin:install',
      'api:rotate',
      'admin:write',
      'settings:write',
      'chat:send',
    ]);
    this.rolePrivileges.set('owner', [
      'read:all',
      'write:all',
      'execute:all',
      'plugin:install',
      'api:rotate',
      'settings:write',
      'chat:send',
    ]);
    this.rolePrivileges.set('member', [
      'read:all',
      'write:all',
      'settings:write',
      'chat:send',
    ]);
    this.rolePrivileges.set('guest', [
      'read:all',
      'chat:send',
    ]);
    this.rolePrivileges.set('agent', [
      'read:all',
      'write:all',
      'execute:all',
      'chat:send',
    ]);
    this.rolePrivileges.set('plugin', [
      'read:all',
      'chat:send',
    ]);
  }

  public hasPermission(role: UserRole, permission: Permission): boolean {
    const list = this.rolePrivileges.get(role) || [];
    const allowed = list.includes(permission);
    if (!allowed) {
      authEventEmitter.emit(AuthEvents.PERMISSION_DENIED, { role, permission });
      auditLogger.log('security_violation', { role, permission, details: 'Unauthorized permission access attempt' });
    }
    return allowed;
  }

  public hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchyWeights: Record<UserRole, number> = {
      admin: 100,
      owner: 90,
      member: 50,
      agent: 40,
      plugin: 30,
      guest: 10,
    };

    const userWeight = hierarchyWeights[userRole] ?? 0;
    const requiredWeight = hierarchyWeights[requiredRole] ?? 0;

    const allowed = userWeight >= requiredWeight;
    if (!allowed) {
      authEventEmitter.emit(AuthEvents.PERMISSION_DENIED, { userRole, requiredRole });
      auditLogger.log('security_violation', { userRole, requiredRole, details: 'Insufficient role rank' });
    }
    return allowed;
  }
}

export const securityManager = new SecurityManager();
export default securityManager;
