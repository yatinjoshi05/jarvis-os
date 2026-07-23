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

/**
 * Returns the correct absolute URL for backend API calls.
 * - In Vite dev server (http://localhost:3000): return relative path (proxied by Vite).
 * - In Tauri app (tauri://localhost) or any other origin: return absolute http://localhost:3001.
 */
export function getBackendApiUrl(endpoint: string): string {
  const p = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const o = window.location.origin;
      if (o === 'http://localhost:3000' || o === 'http://127.0.0.1:3000') {
        return p; // Vite dev proxy handles it
      }
    }
  } catch (_) {}
  return `http://localhost:3001${p}`;
}

export const AI_CONFIG = {
  providers: {
    gemini: {
      apiKey: getEnv('GEMINI_API_KEY'),
      fastModel: getEnv('VITE_GEMINI_FAST_MODEL') || 'gemini-2.0-flash-lite',
      model: getEnv('VITE_GEMINI_MODEL') || 'gemini-3.5-flash',
      complexModel: getEnv('VITE_GEMINI_COMPLEX_MODEL') || 'gemini-2.5-pro',
    },
    openai: {
      apiKey: getEnv('VITE_OPENAI_API_KEY'),
      model: getEnv('VITE_OPENAI_MODEL') || 'gpt-4o',
      baseUrl: getEnv('VITE_OPENAI_BASE_URL') || 'https://api.openai.com/v1',
    },
    claude: {
      apiKey: getEnv('VITE_CLAUDE_API_KEY'),
      model: getEnv('VITE_CLAUDE_MODEL') || 'claude-3-5-sonnet-20241022',
      baseUrl: getEnv('VITE_CLAUDE_BASE_URL') || 'https://api.anthropic.com/v1',
    },
    ollama: {
      enabled: getEnv('VITE_OLLAMA_ENABLED') === 'true' || !!getEnv('VITE_OLLAMA_BASE_URL') || !!getEnv('VITE_OLLAMA_MODEL'),
      model: getEnv('VITE_OLLAMA_MODEL') || 'llama3',
      baseUrl: getEnv('VITE_OLLAMA_BASE_URL') || 'http://localhost:11434',
    },
    local: {
      model: getEnv('VITE_LOCAL_MODEL') || 'local-model',
      baseUrl: getEnv('VITE_LOCAL_BASE_URL') || 'http://localhost:8080/v1',
    },
    nvidia: {
      apiKey: getEnv('NVIDIA_API_KEY'),
      baseUrl: getEnv('VITE_NVIDIA_BASE_URL') || 'https://integrate.api.nvidia.com/v1',
      fastModel: getEnv('VITE_NVIDIA_FAST_MODEL') || getEnv('VITE_NVIDIA_MODEL') || 'meta/llama-3.1-8b-instruct',
      model: getEnv('VITE_NVIDIA_MODEL') || 'meta/llama-3.1-8b-instruct',
      complexModel: getEnv('VITE_NVIDIA_COMPLEX_MODEL') || getEnv('VITE_NVIDIA_MODEL') || 'meta/llama-3.1-8b-instruct',
    }
  },

  cloudflareGateway: {
    enabled: !!getEnv('VITE_CLOUDFLARE_GATEWAY_URL'),
    url: getEnv('VITE_CLOUDFLARE_GATEWAY_URL'),
    token: getEnv('CLOUDFLARE_GATEWAY_TOKEN'),
  },

  fallbackProviders: (getEnv('VITE_AI_FALLBACK_PROVIDERS') || '')
    .split(',')
    .map((provider) => provider.trim())
    .filter(Boolean),

  requestTimeoutMs: Math.max(1000, Number(getEnv('VITE_AI_REQUEST_TIMEOUT_MS')) || 30000),

  defaultProvider: getEnv('VITE_DEFAULT_AI_PROVIDER') || 'gemini',
  maxTokens: 4096,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

const isDev = (() => {
  try {
    return Boolean((import.meta as any)?.env?.DEV);
  } catch (_) {
    return false;
  }
})();

if (isDev) {
  const cfToken = getEnv('VITE_CLOUDFLARE_GATEWAY_TOKEN');
  const nvKey = getEnv('VITE_NVIDIA_API_KEY');
  console.info(`[TEMP-STARTUP-LOG] VITE_CLOUDFLARE_GATEWAY_TOKEN = ${cfToken ? (cfToken.substring(0, 8) + '...') : 'missing'}`);
  console.info(`[TEMP-STARTUP-LOG] VITE_NVIDIA_API_KEY = ${nvKey ? (nvKey.substring(0, 8) + '...') : 'missing'}`);
}

export const VOICE_CONFIG = {
  ttsProvider: getEnv('VITE_TTS_PROVIDER') || 'browser',
  elevenlabs: {
    voiceId: getEnv('VITE_ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM',
    modelId: getEnv('VITE_ELEVENLABS_MODEL') || 'eleven_multilingual_v2',
    baseUrl: '/api/tts/elevenlabs',
  },
  openai: {
    apiKey: getEnv('VITE_OPENAI_API_KEY'),
    voice: getEnv('VITE_OPENAI_TTS_VOICE') || 'alloy',
    model: 'tts-1',
  },
  recognition: {
    lang: 'en-IN',
    continuous: true,
    interimResults: true,
  },
  silenceTimeoutMs: 2500,
  recognitionStartTimeoutMs: 15000,
  noiseThreshold: 0.02,
  autoListen: true,
  autoInterrupt: true,
};

export const GEMINI_MODEL = AI_CONFIG.providers.gemini.model;
export default { AI_CONFIG, VOICE_CONFIG, GEMINI_MODEL };
