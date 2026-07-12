/**
 * Events relating to memory storage actions.
 */
export const MemoryEvents = {
  SAVED: 'memory:saved',
  EVICTED: 'memory:evicted',
} as const;

export type MemoryEvent = typeof MemoryEvents[keyof typeof MemoryEvents];
