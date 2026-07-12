/**
 * Notifications events.
 */
export const NotificationFlowEvents = {
  DISPATCHED: 'notification:dispatched',
  READ: 'notification:read',
} as const;

export type NotificationFlowEvent = typeof NotificationFlowEvents[keyof typeof NotificationFlowEvents];
