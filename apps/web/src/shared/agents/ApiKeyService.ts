export interface StoredApiKey { id: string; provider: string; value: string; createdAt: string; updatedAt: string; }
const STORAGE_KEY = 'jarvis_runtime_api_keys_v1';

export class ApiKeyService {
  private read(): StoredApiKey[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as StoredApiKey[]; } catch { return []; } }
  private write(keys: StoredApiKey[]): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); }
  public list(): StoredApiKey[] { return this.read().map(key => ({ ...key, value: this.mask(key.value) })); }
  public validate(value: string): boolean { return value.trim().length >= 8; }
  public save(provider: string, value: string): StoredApiKey { if (!this.validate(value)) throw new Error('API key must contain at least 8 characters.'); const keys = this.read(); const now = new Date().toISOString(); const existing = keys.find(key => key.provider === provider); const key = existing ? { ...existing, value, updatedAt: now } : { id: crypto.randomUUID?.() ?? `${Date.now()}-${provider}`, provider, value, createdAt: now, updatedAt: now }; this.write([...keys.filter(item => item.provider !== provider), key]); return { ...key, value: this.mask(key.value) }; }
  public remove(provider: string): void { this.write(this.read().filter(key => key.provider !== provider)); }
  public has(provider: string): boolean { return this.read().some(key => key.provider === provider); }
  public mask(value: string): string { return value.length <= 4 ? '•'.repeat(value.length) : `${'•'.repeat(Math.max(8, value.length - 4))}${value.slice(-4)}`; }
}
export const apiKeyService = new ApiKeyService();
