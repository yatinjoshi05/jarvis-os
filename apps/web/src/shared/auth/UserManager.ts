import { User, UserPreferences } from './interfaces';
import { UserRole } from './types';

class UserManager {
  private users = new Map<string, User>();

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    try {
      const stored = localStorage.getItem('jarvis_users');
      if (stored) {
        const list = JSON.parse(stored) as User[];
        list.forEach((u) => this.users.set(u.id, u));
      }
    } catch (_) { /* ignore */ }

    // Seed default admin and guest if empty
    if (this.users.size === 0) {
      this.seedDefaultUsers();
    }
  }

  private seedDefaultUsers() {
    const adminUser: User = {
      id: 'usr_admin',
      email: 'admin@jarvis.os',
      name: 'Administrator',
      role: 'admin',
      preferences: {
        theme: 'dark',
        language: 'en-US',
        timezone: 'Asia/Kolkata',
        aiPreferences: {
          defaultProvider: 'gemini',
          temperature: 0.7,
          maxTokens: 2048,
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const guestUser: User = {
      id: 'usr_guest',
      email: 'guest@jarvis.os',
      name: 'Guest User',
      role: 'guest',
      preferences: {
        theme: 'light',
        language: 'en-US',
        timezone: 'UTC',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(guestUser.id, guestUser);
    this.saveUsers();
  }

  private saveUsers() {
    try {
      const list = Array.from(this.users.values());
      localStorage.setItem('jarvis_users', JSON.stringify(list));
    } catch (_) { /* ignore */ }
  }

  public getUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  public getUserByEmail(email: string): User | null {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return null;
  }

  public createUser(email: string, name: string, role: UserRole = 'member'): User {
    const id = `usr_${Math.random().toString(36).substr(2, 9)}${Date.now()}`;
    const newUser: User = {
      id,
      email,
      name,
      role,
      preferences: {
        theme: 'dark',
        language: 'en-US',
        timezone: 'UTC'
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.users.set(id, newUser);
    this.saveUsers();
    return newUser;
  }

  public updateUserPreferences(id: string, preferences: Partial<UserPreferences>): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`[UserManager] User ${id} not found.`);
    }

    user.preferences = { ...user.preferences, ...preferences };
    user.updatedAt = Date.now();
    this.saveUsers();
    return user;
  }

  public updateUserProfile(id: string, name: string, avatarUrl?: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`[UserManager] User ${id} not found.`);
    }

    user.name = name;
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }
    user.updatedAt = Date.now();
    this.saveUsers();
    return user;
  }
}

export const userManager = new UserManager();
export default userManager;
