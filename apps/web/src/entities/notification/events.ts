/**
 * Target status changes.
 */
export const NotificationEntityEvents = {
  STATUS_CHANGED: 'notification-entity:status_changed',
} as const;

export type NotificationEntityEvent = typeof NotificationEntityEvents[keyof typeof NotificationEntityEvents];
