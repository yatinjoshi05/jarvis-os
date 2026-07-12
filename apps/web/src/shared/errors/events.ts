/**
 * Error monitoring events.
 */
export const ErrorEvents = {
  CAUGHT: 'errors:caught',
  UNHANDLED: 'errors:unhandled',
} as const;

export type ErrorEvent = typeof ErrorEvents[keyof typeof ErrorEvents];
