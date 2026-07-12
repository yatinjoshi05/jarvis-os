import { NotificationStatus } from './types';

/**
 * Notification log data record.
 */
export interface NotificationEntity {
  id: string;
  recipientId: string;
  messageText: string;
  status: NotificationStatus;
  createdAt: number;
}
