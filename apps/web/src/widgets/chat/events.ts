/**
 * Scroll changes events.
 */
export const ChatWidgetEvents = {
  SCROLLED_TO_BOTTOM: 'chat-widget:scrolled_to_bottom',
} as const;

export type ChatWidgetEvent = typeof ChatWidgetEvents[keyof typeof ChatWidgetEvents];
