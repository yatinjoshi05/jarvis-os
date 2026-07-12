import { ConversationStatus } from './types';

/**
 * Representation of an active conversation model.
 */
export interface Conversation {
  id: string;
  title: string;
  status: ConversationStatus;
  createdAt: number;
}

/**
 * User participant schema.
 */
export interface ConversationParticipant {
  userId: string;
  joinedAt: number;
}
