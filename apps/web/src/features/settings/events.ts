/**
 * System preferences modifications.
 */
export const SettingsEvents = {
  THEME_CHANGED: 'settings:theme_changed',
  LOCALE_CHANGED: 'settings:locale_changed',
} as const;

export type SettingsEvent = typeof SettingsEvents[keyof typeof SettingsEvents];
