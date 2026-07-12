/**
 * State change events emitted by stores.
 */
export const StoreEvents = {
  UPDATED: 'store:updated',
  RESET: 'store:reset',
} as const;

export type StoreEvent = typeof StoreEvents[keyof typeof StoreEvents];
