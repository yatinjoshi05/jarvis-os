import { ApiKey } from './interfaces';
import { Permission } from './types';
import { PasswordUtils } from './PasswordUtils';

class ApiKeyManager {
  private keys = new Map<string, ApiKey>();

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    try {
      const stored = localStorage.getItem('jarvis_api_keys');
      if (stored) {
        const list = JSON.parse(stored) as ApiKey[];
        list.forEach((k) => this.keys.set(k.id, k));
      }
    } catch (_) { /* ignore */ }
  }

  private saveKeys() {
    try {
      const list = Array.from(this.keys.values());
      localStorage.setItem('jarvis_api_keys', JSON.stringify(list));
    } catch (_) { /* ignore */ }
  }

  public async createKey(
    name: string,
    userId: string,
    permissions: Permission[],
    expiresInDays?: number
  ): Promise<{ apiKey: string; record: ApiKey }> {
    const keyId = `key_${Math.random().toString(36).substr(2, 9)}${Date.now()}`;
    const rawSecret = `jk_${Math.random().toString(36).substr(2, 15)}${Math.random().toString(36).substr(2, 15)}`;
    
    const secretHash = await PasswordUtils.hashPassword(rawSecret);
    const prefix = rawSecret.substring(0, 7);

    const expiresAt = expiresInDays ? Date.now() + expiresInDays * 24 * 3600 * 1000 : undefined;

    const record: ApiKey = {
      id: keyId,
      name,
      prefix,
      secretHash,
      userId,
      permissions,
      createdAt: Date.now(),
      expiresAt,
      isRevoked: false
    };

    this.keys.set(keyId, record);
    this.saveKeys();

    return {
      apiKey: rawSecret,
      record
    };
  }

  public async validateKey(rawSecret: string): Promise<ApiKey | null> {
    const prefix = rawSecret.substring(0, 7);
    const candidateHash = await PasswordUtils.hashPassword(rawSecret);

    for (const key of this.keys.values()) {
      if (key.prefix === prefix && !key.isRevoked) {
        if (key.expiresAt && key.expiresAt < Date.now()) {
          continue;
        }
        if (key.secretHash === candidateHash) {
          key.lastUsedAt = Date.now();
          this.saveKeys();
          return key;
        }
      }
    }

    return null;
  }

  public revokeKey(id: string) {
    const key = this.keys.get(id);
    if (key) {
      key.isRevoked = true;
      this.saveKeys();
      return true;
    }
    return false;
  }

  public getKeysByUser(userId: string): ApiKey[] {
    return Array.from(this.keys.values()).filter((k) => k.userId === userId);
  }

  public async rotateKey(id: string): Promise<{ apiKey: string; record: ApiKey } | null> {
    const oldKey = this.keys.get(id);
    if (!oldKey) return null;

    this.revokeKey(id);

    return this.createKey(oldKey.name, oldKey.userId, oldKey.permissions, oldKey.expiresAt ? Math.ceil((oldKey.expiresAt - Date.now()) / (24 * 3600 * 1000)) : undefined);
  }
}

export const apiKeyManager = new ApiKeyManager();
export default apiKeyManager;
