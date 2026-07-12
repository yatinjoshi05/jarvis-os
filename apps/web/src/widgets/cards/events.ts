/**
 * Card click action events.
 */
export const CardWidgetEvents = {
  CARD_CLICKED: 'card-widget:clicked',
} as const;

export type CardWidgetEvent = typeof CardWidgetEvents[keyof typeof CardWidgetEvents];
