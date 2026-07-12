/**
 * Flow messages dispatched during chats.
 */
export const ChatFlowEvents = {
  MESSAGE_SENT: 'chat:message_sent',
  MESSAGE_RECEIVED: 'chat:message_received',
} as const;

export type ChatFlowEvent = typeof ChatFlowEvents[keyof typeof ChatFlowEvents];
