/**
 * Emitted by services when states change.
 */
export const ServiceEvents = {
  STARTED: 'service:started',
  STOPPED: 'service:stopped',
  CRASHED: 'service:crashed',
} as const;

export type ServiceEvent = typeof ServiceEvents[keyof typeof ServiceEvents];
