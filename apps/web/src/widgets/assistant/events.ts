/**
 * Assistant component UI events triggers.
 */
export const AssistantWidgetEvents = {
  VIEW_MODE_CHANGED: 'assistant-widget:view_mode_changed',
} as const;

export type AssistantWidgetEvent = typeof AssistantWidgetEvents[keyof typeof AssistantWidgetEvents];
