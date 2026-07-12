export const AI_CONFIG = {
  providers: {
    gemini: {
      apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
      model: (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.5-flash',
    },
    openai: {
      apiKey: (import.meta.env.VITE_OPENAI_API_KEY as string) || '',
      model: (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o',
      baseUrl: (import.meta.env.VITE_OPENAI_BASE_URL as string) || 'https://api.openai.com/v1',
    },
    claude: {
      apiKey: (import.meta.env.VITE_CLAUDE_API_KEY as string) || '',
      model: (import.meta.env.VITE_CLAUDE_MODEL as string) || 'claude-3-5-sonnet-20241022',
      baseUrl: (import.meta.env.VITE_CLAUDE_BASE_URL as string) || 'https://api.anthropic.com/v1',
    },
    ollama: {
      model: (import.meta.env.VITE_OLLAMA_MODEL as string) || 'llama3',
      baseUrl: (import.meta.env.VITE_OLLAMA_BASE_URL as string) || 'http://localhost:11434',
    },
    local: {
      model: (import.meta.env.VITE_LOCAL_MODEL as string) || 'local-model',
      baseUrl: (import.meta.env.VITE_LOCAL_BASE_URL as string) || 'http://localhost:8080/v1',
    }
  },
  defaultProvider: 'gemini',
  maxTokens: 4096,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

export const GEMINI_MODEL = AI_CONFIG.providers.gemini.model;
