export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'developer' | 'guest'
  provider: 'local' | 'google' | 'github' | 'guest'
  avatarUrl?: string
}

export interface SecurityAuditLog {
  id: string
  timestamp: string
  action: string
  user: string
  status: 'allowed' | 'blocked'
  details?: string
}

class SecurityFramework {
  private currentUser: UserProfile = {
    id: 'user-01',
    name: 'JARVIS Architect',
    email: 'architect@jarvis.os',
    role: 'admin',
    provider: 'local',
  }

  private auditLogs: SecurityAuditLog[] = []

  public getCurrentUser(): UserProfile {
    return this.currentUser
  }

  public loginAs(profile: UserProfile): void {
    this.currentUser = profile
    this.logAction('USER_LOGIN', `Logged in via ${profile.provider}`)
  }

  public logAction(action: string, details?: string, blocked = false): void {
    const entry: SecurityAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      user: this.currentUser.email,
      status: blocked ? 'blocked' : 'allowed',
      details,
    }
    this.auditLogs.push(entry)
  }

  public getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs]
  }

  public authorizeCapability(capability: string): boolean {
    if (this.currentUser.role === 'admin') return true
    if (this.currentUser.role === 'developer' && capability !== 'system_shutdown') return true
    return false
  }
}

export const securityFramework = new SecurityFramework()
