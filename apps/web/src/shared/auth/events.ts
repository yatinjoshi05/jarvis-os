export const AuthEvents = {
  USER_LOGGED_IN: 'auth:logged_in',
  USER_LOGGED_OUT: 'auth:logged_out',
  SESSION_CREATED: 'auth:session_created',
  SESSION_EXPIRED: 'auth:session_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  ROLE_CHANGED: 'auth:role_changed',
  PERMISSION_DENIED: 'auth:permission_denied',
} as const;

export type AuthEvent = typeof AuthEvents[keyof typeof AuthEvents];

type AuthEventListener = (data: any) => void;

class AuthEventEmitter {
  private listeners: Map<string, Set<AuthEventListener>> = new Map();

  public on(event: string, listener: AuthEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: AuthEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  public emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in auth event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const authEventEmitter = new AuthEventEmitter();
