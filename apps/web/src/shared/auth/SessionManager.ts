import { Session } from './interfaces';
import { AUTH_CONFIG } from './config';
import { TokenManager } from './TokenManager';
import { UserRole } from './types';
import { SessionExpiredError } from './errors';

class SessionManager {
  private sessions = new Map<string, Session>();

  constructor() {
    this.loadSessions();
  }

  private loadSessions() {
    try {
      const stored = localStorage.getItem('jarvis_active_sessions');
      if (stored) {
        const list = JSON.parse(stored) as Session[];
        list.forEach((s) => this.sessions.set(s.id, s));
      }
    } catch (_) { /* ignore */ }
  }

  private saveSessions() {
    try {
      const list = Array.from(this.sessions.values());
      localStorage.setItem('jarvis_active_sessions', JSON.stringify(list));
    } catch (_) { /* ignore */ }
  }

  public createSession(userId: string, email: string, role: UserRole, deviceId = 'web_client'): Session {
    const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}${Date.now()}`;
    const token = TokenManager.generateToken({ sub: userId, email, role }, AUTH_CONFIG.session.longevitySeconds);
    const refreshToken = TokenManager.generateRefreshToken(userId);

    const session: Session = {
      id: sessionId,
      userId,
      token,
      refreshToken,
      deviceId,
      createdAt: Date.now(),
      expiresAt: Date.now() + AUTH_CONFIG.session.longevitySeconds * 1000,
      isActive: true
    };

    if (!AUTH_CONFIG.session.multiDeviceSupported) {
      for (const oldSess of this.sessions.values()) {
        if (oldSess.userId === userId && oldSess.id !== sessionId) {
          oldSess.isActive = false;
        }
      }
    }

    this.sessions.set(sessionId, session);
    this.saveSessions();
    return session;
  }

  public validateSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new SessionExpiredError('Session is invalid or inactive');
    }

    if (session.expiresAt < Date.now()) {
      session.isActive = false;
      this.saveSessions();
      throw new SessionExpiredError('Session has expired');
    }

    return session;
  }

  public refreshSession(sessionId: string, refreshToken: string, email: string, role: UserRole): Session {
    const session = this.sessions.get(sessionId);
    if (!session || session.refreshToken !== refreshToken || !session.isActive) {
      throw new SessionExpiredError('Invalid session refresh request');
    }

    const token = TokenManager.generateToken({ sub: session.userId, email, role }, AUTH_CONFIG.session.longevitySeconds);
    
    session.token = token;
    session.expiresAt = Date.now() + AUTH_CONFIG.session.longevitySeconds * 1000;

    this.saveSessions();
    return session;
  }

  public invalidateSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.saveSessions();
    }
  }

  public getSessionsByUser(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId && s.isActive);
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
