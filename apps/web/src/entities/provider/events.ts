/**
 * Processing providers status updates.
 */
export const ProviderEntityEvents = {
  STATUS_CHANGED: 'provider-entity:status_changed',
} as const;

export type ProviderEntityEvent = typeof ProviderEntityEvents[keyof typeof ProviderEntityEvents];
