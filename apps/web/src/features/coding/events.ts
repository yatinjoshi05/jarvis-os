/**
 * Compile and execution triggers.
 */
export const CodingEvents = {
  CODE_COMPILED: 'coding:code_compiled',
  CODE_SAVED: 'coding:code_saved',
} as const;

export type CodingEvent = typeof CodingEvents[keyof typeof CodingEvents];
