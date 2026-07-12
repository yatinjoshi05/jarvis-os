import { AUTH_CONFIG } from './config';
import { AuthenticationProvider } from './interfaces';

export class AuthProviders {
  public static getProviders(): AuthenticationProvider[] {
    const config = AUTH_CONFIG.providers;
    return [
      { id: 'credentials', name: 'Email + Password', isEnabled: config.credentials.isEnabled, type: 'credentials' },
      { id: 'google', name: 'Google OAuth', isEnabled: config.google.isEnabled, type: 'oauth' },
      { id: 'github', name: 'GitHub OAuth', isEnabled: config.github.isEnabled, type: 'oauth' },
      { id: 'microsoft', name: 'Microsoft OAuth', isEnabled: config.microsoft.isEnabled, type: 'oauth' },
      { id: 'apple', name: 'Apple OAuth', isEnabled: config.apple.isEnabled, type: 'oauth' },
      { id: 'otp', name: 'Phone OTP', isEnabled: config.otp.isEnabled, type: 'otp' },
      { id: 'magicLink', name: 'Magic Link', isEnabled: config.magicLink.isEnabled, type: 'passwordless' },
      { id: 'guest', name: 'Guest Mode', isEnabled: config.guest.isEnabled, type: 'guest' },
    ];
  }

  public static isProviderEnabled(id: string): boolean {
    const provider = this.getProviders().find((p) => p.id === id);
    return provider ? provider.isEnabled : false;
  }
}
export default AuthProviders;
