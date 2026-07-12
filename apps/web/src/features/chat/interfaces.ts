import { ChatRole } from './types';

/**
 * Defines a chat session header.
 */
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

/**
 * Outbound message content.
 */
export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
  timestamp: number;
}
