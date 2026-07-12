export const MEMORY_CONFIG = {
  defaultProvider: 'local-storage',
  shortTerm: {
    maxConversations: 10,
    maxMessagesPerConversation: 50,
    maxTokens: 4096,
  },
  longTerm: {
    maxRecords: 1000,
  },
  working: {
    maxObjectiveLength: 500,
  },
  ranking: {
    recencyWeight: 0.3,
    importanceWeight: 0.3,
    frequencyWeight: 0.1,
    relevanceWeight: 0.3,
  },
  compression: {
    triggerLength: 20, // Compress history when there are more than 20 messages
    targetLength: 8,   // Compress down to 8 messages (summarized context + newest)
  }
};

export default MEMORY_CONFIG;
