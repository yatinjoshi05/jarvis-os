import { UserPermission } from './types';

/**
 * User schema database model.
 */
export interface UserEntity {
  id: string;
  email: string;
  permissions: UserPermission[];
  createdAt: number;
}

/**
 * Preferences and metadata.
 */
export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  preferredLanguage: string;
}
