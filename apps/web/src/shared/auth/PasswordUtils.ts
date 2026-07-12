export class PasswordUtils {
  /**
   * Hashes a password using standard SHA-256 Web Crypto API.
   */
  public static async hashPassword(password: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      // Fallback for non-browser/testing environments
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return `hash_${hash}`;
    }

    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies if a password matches a hash.
   */
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }

  /**
   * Validates strength requirements (length, case, numbers, special characters).
   */
  public static validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
export default PasswordUtils;
