/**
 * Ripples animation finish triggers.
 */
export const VoiceWidgetEvents = {
  RIPPLE_ANIMATION_END: 'voice-widget:ripple_animation_end',
} as const;

export type VoiceWidgetEvent = typeof VoiceWidgetEvents[keyof typeof VoiceWidgetEvents];
