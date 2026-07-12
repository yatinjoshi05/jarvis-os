import { LeadStatus } from './types';

/**
 * Lead database record model.
 */
export interface LeadEntity {
  id: string;
  contactName: string;
  companyName?: string;
  status: LeadStatus;
  score: number;
}

/**
 * Lead source identification schema.
 */
export interface LeadSource {
  medium: string;
  campaign?: string;
}
