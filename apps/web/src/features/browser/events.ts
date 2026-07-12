/**
 * Browser tab events.
 */
export const BrowserEvents = {
  TAB_OPENED: 'browser:tab_opened',
  TAB_CLOSED: 'browser:tab_closed',
  NAVIGATED: 'browser:navigated',
} as const;

export type BrowserEvent = typeof BrowserEvents[keyof typeof BrowserEvents];
