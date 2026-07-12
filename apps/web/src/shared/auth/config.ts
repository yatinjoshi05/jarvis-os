export const AUTH_CONFIG = {
  providers: {
    credentials: {
      isEnabled: true,
      requireStrength: true,
    },
    google: {
      isEnabled: (import.meta.env.VITE_AUTH_GOOGLE_ENABLED === 'true') || false,
      clientId: (import.meta.env.VITE_AUTH_GOOGLE_CLIENT_ID as string) || '',
    },
    github: {
      isEnabled: (import.meta.env.VITE_AUTH_GITHUB_ENABLED === 'true') || false,
      clientId: (import.meta.env.VITE_AUTH_GITHUB_CLIENT_ID as string) || '',
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
