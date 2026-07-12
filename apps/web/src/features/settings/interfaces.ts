import { AppTheme } from './types';

/**
 * System preference structure.
 */
export interface SystemPreference {
  locale: string;
  timezone: string;
  notificationsEnabled: boolean;
}

/**
 * Themes properties.
 */
export interface ThemeSettings {
  currentTheme: AppTheme;
  contrastRatio: 'normal' | 'high';
}
