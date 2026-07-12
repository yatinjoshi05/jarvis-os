import { UserRole } from './types';
import { InvalidTokenError } from './errors';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  scopes?: string[];
}

export class TokenManager {
  /**
   * Generates a mock structured JWT token.
   */
  public static generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInSeconds = 3600 * 24): string {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;
    
    const fullPayload: TokenPayload = {
      ...payload,
      iat,
      exp
    };

    // Encode payload as Base64 JSON (simulated JWT structure)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(fullPayload));
    const signature = btoa('mock_signature_' + fullPayload.sub);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Decodes and validates a token.
   */
  public static verifyToken(token: string): TokenPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new InvalidTokenError('Invalid token format');
      }

      const bodyDecoded = atob(parts[1]);
      const payload = JSON.parse(bodyDecoded) as TokenPayload;
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new InvalidTokenError('Token has expired');
      }

      return payload;
    } catch (e: any) {
      throw new InvalidTokenError(e.message || 'Token verification failed');
    }
  }

  public static generateRefreshToken(userId: string): string {
    return `ref_${userId}_${Math.random().toString(36).substr(2, 10)}${Date.now()}`;
  }

  public static generatePluginToken(pluginId: string, allowedScopes: string[]): string {
    return this.generateToken({
      sub: `plugin_${pluginId}`,
      email: `${pluginId}@plugin.jarvis`,
      role: 'plugin',
      scopes: allowedScopes
    }, 3600 * 30); // 30 days
  }
}
export default TokenManager;
