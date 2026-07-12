/**
 * Events related to dynamic schema/type parsing.
 */
export const TypeEvents = {
  PARSING_FAILED: 'types:parsing_failed',
} as const;

export type TypeEvent = typeof TypeEvents[keyof typeof TypeEvents];
