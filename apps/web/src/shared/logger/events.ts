/**
 * Events emitted when logs are successfully flushed.
 */
export const LoggerEvents = {
  LOG_FLUSHED: 'logger:flushed',
} as const;

export type LoggerEvent = typeof LoggerEvents[keyof typeof LoggerEvents];
