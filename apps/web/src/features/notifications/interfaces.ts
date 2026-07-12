import { NotificationUrgency } from './types';

/**
 * Target dispatch routes.
 */
export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  enabled: boolean;
}

/**
 * Active dispatch notification fields.
 */
export interface NotificationPayload {
  title: string;
  body: string;
  urgency: NotificationUrgency;
  icon?: string;
}
