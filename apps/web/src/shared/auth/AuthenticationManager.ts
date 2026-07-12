import { User, Session } from './interfaces';
import { UserRole, Permission } from './types';
import { userManager } from './UserManager';
import { sessionManager } from './SessionManager';
import { securityManager } from './SecurityManager';
import { auditLogger } from './AuditLogger';
import { PasswordUtils } from './PasswordUtils';
import { InvalidCredentialsError, UnauthorizedError } from './errors';
import { authEventEmitter, AuthEvents } from './events';
import { AuthProviders } from './Providers';

export class AuthenticationManager {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const activeSessionId = localStorage.getItem('jarvis_active_session_id');
      if (activeSessionId) {
        const session = sessionManager.validateSession(activeSessionId);
        const user = userManager.getUser(session.userId);
        if (user) {
          this.currentUser = user;
          this.currentSession = session;
          authEventEmitter.emit(AuthEvents.SESSION_CREATED, session);
        }
      }
    } catch (_) {
      this.logout();
    }
  }

  public async login(email: string, password?: string): Promise<{ user: User; session: Session }> {
    if (!AuthProviders.isProviderEnabled(password ? 'credentials' : 'magicLink')) {
      throw new Error('[AuthManager] Auth provider is not enabled in settings.');
    }

    const user = userManager.getUserByEmail(email);
    if (!user) {
      auditLogger.log('failed_auth', { email, reason: 'User not found' });
      throw new InvalidCredentialsError('Invalid email or password.');
    }

    if (password) {
      // Credentials login: verify password hash
      const userHash = localStorage.getItem(`jarvis_pwd_hash_${user.id}`);
      if (!userHash) {
        // Fallback for default seeded users who don't have password hashes yet
        const defaultHash = await PasswordUtils.hashPassword('Password123!');
        if (password !== 'Password123!') {
          auditLogger.log('failed_auth', { email, reason: 'Invalid password' }, user.id);
          throw new InvalidCredentialsError('Invalid email or password.');
        }
        localStorage.setItem(`jarvis_pwd_hash_${user.id}`, defaultHash);
      } else {
        const matches = await PasswordUtils.verifyPassword(password, userHash);
        if (!matches) {
          auditLogger.log('failed_auth', { email, reason: 'Invalid password' }, user.id);
          throw new InvalidCredentialsError('Invalid email or password.');
        }
      }
    }

    const session = sessionManager.createSession(user.id, user.email, user.role);
    this.currentUser = user;
    this.currentSession = session;

    localStorage.setItem('jarvis_active_session_id', session.id);
    
    auditLogger.log('login', { email, role: user.role }, user.id);
    authEventEmitter.emit(AuthEvents.USER_LOGGED_IN, user);

    return { user, session };
  }

  public async register(email: string, name: string, password?: string): Promise<{ user: User; session: Session }> {
    if (userManager.getUserByEmail(email)) {
      throw new Error('User with this email already exists.');
    }

    if (password) {
      const validation = PasswordUtils.validateStrength(password);
      if (!validation.isValid) {
        throw new Error(`Password strength failed: ${validation.errors.join(' ')}`);
      }
    }

    const user = userManager.createUser(email, name, 'member');
    
    if (password) {
      const hash = await PasswordUtils.hashPassword(password);
      localStorage.setItem(`jarvis_pwd_hash_${user.id}`, hash);
    }

    const session = sessionManager.createSession(user.id, user.email, user.role);
    this.currentUser = user;
    this.currentSession = session;

    localStorage.setItem('jarvis_active_session_id', session.id);

    auditLogger.log('login', { email, details: 'User registered' }, user.id);
    authEventEmitter.emit(AuthEvents.USER_LOGGED_IN, user);

    return { user, session };
  }

  public logout() {
    if (this.currentSession) {
      const userId = this.currentUser?.id;
      const email = this.currentUser?.email;
      
      sessionManager.invalidateSession(this.currentSession.id);
      
      this.currentUser = null;
      this.currentSession = null;
      
      localStorage.removeItem('jarvis_active_session_id');

      auditLogger.log('logout', { email }, userId);
      authEventEmitter.emit(AuthEvents.USER_LOGGED_OUT, { userId });
    }
  }

  public refreshSession(): Session {
    if (!this.currentSession || !this.currentUser) {
      throw new UnauthorizedError('No active session to refresh');
    }

    const newSession = sessionManager.refreshSession(
      this.currentSession.id,
      this.currentSession.refreshToken,
      this.currentUser.email,
      this.currentUser.role
    );

    this.currentSession = newSession;
    authEventEmitter.emit(AuthEvents.TOKEN_REFRESHED, newSession);
    return newSession;
  }

  public validateSession(): boolean {
    if (!this.currentSession) return false;
    try {
      sessionManager.validateSession(this.currentSession.id);
      return true;
    } catch (_) {
      this.logout();
      return false;
    }
  }

  public hasPermission(permission: Permission): boolean {
    if (!this.currentUser) return false;
    return securityManager.hasPermission(this.currentUser.role, permission);
  }

  public hasRole(requiredRole: UserRole): boolean {
    if (!this.currentUser) return false;
    return securityManager.hasRole(this.currentUser.role, requiredRole);
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getSession(): Session | null {
    return this.currentSession;
  }

  public loginAsGuest(): { user: User; session: Session } {
    if (!AuthProviders.isProviderEnabled('guest')) {
      throw new Error('[AuthManager] Guest auth provider is not enabled.');
    }

    const guestUser = userManager.getUser('usr_guest');
    if (!guestUser) {
      throw new Error('[AuthManager] Seeding guest user missing.');
    }

    const session = sessionManager.createSession(guestUser.id, guestUser.email, guestUser.role);
    this.currentUser = guestUser;
    this.currentSession = session;

    localStorage.setItem('jarvis_active_session_id', session.id);

    auditLogger.log('login', { email: guestUser.email, guest: true }, guestUser.id);
    authEventEmitter.emit(AuthEvents.USER_LOGGED_IN, guestUser);

    return { user: guestUser, session };
  }
}

export const authenticationManager = new AuthenticationManager();
export default authenticationManager;
