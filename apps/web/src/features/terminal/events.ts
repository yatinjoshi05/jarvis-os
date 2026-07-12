/**
 * Terminal input execution logs events.
 */
export const TerminalEvents = {
  COMMAND_EXECUTED: 'terminal:command_executed',
  OUTPUT_RECEIVED: 'terminal:output_received',
} as const;

export type TerminalEvent = typeof TerminalEvents[keyof typeof TerminalEvents];
