/**
 * Configuration change events.
 */
export const ConfigEvents = {
  LOADED: 'config:loaded',
  UPDATED: 'config:updated',
} as const;

export type ConfigEvent = typeof ConfigEvents[keyof typeof ConfigEvents];
