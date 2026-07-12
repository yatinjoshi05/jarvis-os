import { MessageType } from './types';

/**
 * Database schema representation of a message.
 */
export interface MessageEntity {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  body: string;
  timestamp: number;
}

/**
 * Payload attachments structure.
 */
export interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}
