/**
 * Input keypress events.
 */
export const TerminalWidgetEvents = {
  KEY_PRESSED: 'terminal-widget:key_pressed',
} as const;

export type TerminalWidgetEvent = typeof TerminalWidgetEvents[keyof typeof TerminalWidgetEvents];
