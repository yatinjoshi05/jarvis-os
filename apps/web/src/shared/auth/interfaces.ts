import { UserRole } from './types';

/**
 * Session payload containing authenticated user details.
 */
export interface AuthSession {
  userId: string;
  token: string;
  roles: UserRole[];
  expiresAt: number;
}
