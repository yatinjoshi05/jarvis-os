/**
 * Database status and query events.
 */
export const DatabaseEvents = {
  CONNECTED: 'database:connected',
  DISCONNECTED: 'database:disconnected',
  QUERY_ERROR: 'database:query_error',
} as const;

export type DatabaseEvent = typeof DatabaseEvents[keyof typeof DatabaseEvents];
