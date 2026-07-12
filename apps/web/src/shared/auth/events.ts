/**
 * Events emitted on authentication state changes.
 */
export const AuthEvents = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  SESSION_EXPIRED: 'auth:session_expired',
} as const;

export type AuthEvent = typeof AuthEvents[keyof typeof AuthEvents];
