/**
 * Provider lifecycle events.
 */
export const ProviderEvents = {
  STATE_CHANGED: 'provider:state_changed',
} as const;

export type ProviderEvent = typeof ProviderEvents[keyof typeof ProviderEvents];
