import { ContactStage } from './types';

/**
 * Contact person representation.
 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: ContactStage;
}

/**
 * Log of CRM communications.
 */
export interface InteractionRecord {
  id: string;
  contactId: string;
  notes: string;
  timestamp: number;
}
