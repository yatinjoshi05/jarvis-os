/**
 * Automation state transitions.
 */
export const AutomationEvents = {
  TRIGGERED: 'automation:triggered',
  COMPLETED: 'automation:completed',
} as const;

export type AutomationEvent = typeof AutomationEvents[keyof typeof AutomationEvents];
