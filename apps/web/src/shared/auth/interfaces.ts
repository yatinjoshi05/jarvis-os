import { UserRole, Permission } from './types';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  aiPreferences?: {
    defaultProvider: string;
    temperature: number;
    maxTokens: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceId: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  secretHash: string;
  userId: string;
  permissions: Permission[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  isRevoked: boolean;
}

export interface AuthenticationProvider {
  id: string;
  name: string;
  isEnabled: boolean;
  type: 'oauth' | 'credentials' | 'passwordless' | 'otp' | 'guest';
}

export interface AuthSession {
  userId: string;
  token: string;
  roles: UserRole[];
  expiresAt: number;
}
