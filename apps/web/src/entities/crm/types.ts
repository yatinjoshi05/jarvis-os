export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Meeting Scheduled'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type TaskType = 'follow-up' | 'meeting' | 'phone_call' | 'email' | 'whatsapp';

export type TaskStatus = 'pending' | 'completed';

export type ReminderType =
  | 'meeting'
  | 'renewal'
  | 'payment'
  | 'follow-up'
  | 'birthday'
  | 'policy_expiry'
  | 'goal_review';

export type MeetingStatus = 'scheduled' | 'cancelled' | 'completed';

export type CommunicationChannel = 'email' | 'whatsapp' | 'sms' | 'voice_call';

export type CommunicationDirection = 'inbound' | 'outbound';

export type DocumentCategory = 'KYC' | 'identity_proof' | 'policy_file' | 'investment_report' | 'other';

export type NoteType = 'manual' | 'ai' | 'meeting_summary' | 'follow-up';
