/**
 * Active events triggers.
 */
export const ConversationEntityEvents = {
  CONVERSATION_CREATED: 'conversation-entity:created',
  CONVERSATION_DELETED: 'conversation-entity:deleted',
} as const;

export type ConversationEntityEvent = typeof ConversationEntityEvents[keyof typeof ConversationEntityEvents];
