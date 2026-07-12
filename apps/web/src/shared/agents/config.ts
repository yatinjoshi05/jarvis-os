export const AGENT_CONFIG = {
  maxRetries: 3,
  defaultTimeoutMs: 30000, // 30 seconds
  maxParallelTasks: 5,
  permissions: {
    restrictFilesystem: true,
    restrictTerminal: true,
    restrictNetwork: false
  },
  supportedProviders: ['gemini', 'openai', 'anthropic'],
  defaultWorkspaceId: 'work_main'
};

export default AGENT_CONFIG;
