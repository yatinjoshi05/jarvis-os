function getEnv(key: string): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && key in metaEnv) return metaEnv[key] || '';
  } catch (_) {}
  try {
    const g = globalThis as any;
    if (g.process?.env && key in g.process.env) {
      return g.process.env[key] || '';
    }
  } catch (_) {}
  return '';
}

export const AUTH_CONFIG = {
  providers: {
    credentials: {
      isEnabled: true,
      requireStrength: true,
    },
    google: {
      isEnabled: getEnv('VITE_AUTH_GOOGLE_ENABLED') === 'true',
      clientId: getEnv('VITE_AUTH_GOOGLE_CLIENT_ID'),
    },
    github: {
      isEnabled: getEnv('VITE_AUTH_GITHUB_ENABLED') === 'true',
      clientId: getEnv('VITE_AUTH_GITHUB_CLIENT_ID'),
    },
    microsoft: {
      isEnabled: false,
    },
    apple: {
      isEnabled: false,
    },
    otp: {
      isEnabled: false,
    },
    magicLink: {
      isEnabled: true,
    },
    guest: {
      isEnabled: true,
    }
  },
  session: {
    longevitySeconds: 3600 * 24, // 24 hours
    refreshWindowSeconds: 300, // 5 minutes before expiry
    multiDeviceSupported: true,
  },
  security: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
  }
};

export default AUTH_CONFIG;
