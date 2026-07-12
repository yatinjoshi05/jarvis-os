/**
 * Delivery statuses modification triggers.
 */
export const MessageEntityEvents = {
  STATUS_UPDATED: 'message-entity:status_updated',
} as const;

export type MessageEntityEvent = typeof MessageEntityEvents[keyof typeof MessageEntityEvents];
