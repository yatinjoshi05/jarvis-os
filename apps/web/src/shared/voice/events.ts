/**
 * Events related to voice hardware capture.
 */
export const VoiceHardwareEvents = {
  MIC_ACTIVE: 'voice:mic_active',
  MIC_INACTIVE: 'voice:mic_inactive',
} as const;

export type VoiceHardwareEvent = typeof VoiceHardwareEvents[keyof typeof VoiceHardwareEvents];
