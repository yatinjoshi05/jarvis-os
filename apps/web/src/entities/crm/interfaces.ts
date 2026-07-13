import {
  LeadStatus,
  TaskType,
  TaskStatus,
  ReminderType,
  MeetingStatus,
  CommunicationChannel,
  CommunicationDirection,
  DocumentCategory,
  NoteType
} from './types';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  score: number;
  tags: string[];
  ownerId: string; // assigned agent user ID
  financialScore: number;
  engagementScore: number;
  priorityScore: number;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  userId?: string; // Optional link to auth User
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  familyDetails?: {
    spouse?: string;
    dependentsCount?: number;
  };
  financialProfileId?: string; // Link to Financial OS Profile
  customFields?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  leadId?: string;
  customerId?: string;
  type: TaskType;
  title: string;
  description: string;
  deadline: number;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  userId?: string;
  leadId?: string;
  customerId?: string;
  type: ReminderType;
  title: string;
  description: string;
  triggerTime: number;
  isFired: boolean;
  createdAt: number;
}

export interface Meeting {
  id: string;
  leadId?: string;
  customerId?: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location?: string;
  status: MeetingStatus;
  createdAt: number;
}

export interface Activity {
  id: string;
  leadId?: string;
  customerId?: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'ai_conversation' | 'note' | 'document' | 'status_change';
  title: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Pipeline {
  stages: LeadStatus[];
}

export interface Communication {
  id: string;
  leadId?: string;
  customerId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  sender: string;
  recipient: string;
  subject?: string;
  content: string;
  timestamp: number;
  durationSeconds?: number;
}

export interface Document {
  id: string;
  leadId?: string;
  customerId?: string;
  name: string;
  category: DocumentCategory;
  uploadDate: number;
  fileUrl: string;
  ocrText?: string;
}

export interface Note {
  id: string;
  leadId?: string;
  customerId?: string;
  type: NoteType;
  content: string;
  authorId: string;
  timestamp: number;
}

// Future Compatibility Interfaces for CRM scaling
export interface SalesTeam {
  id: string;
  name: string;
  managerId: string;
  agentIds: string[];
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
}

export interface MultiTenantCRMProvider {
  tenantId: string;
  getTenantDetails(): Promise<{ name: string; maxLeadsLimit: number }>;
}

export interface CallRecordingProvider {
  startRecording(callId: string): Promise<boolean>;
  stopRecording(callId: string): Promise<string>; // returns audio file url
  transcribeRecording(audioUrl: string): Promise<string>;
}

export interface WhatsAppBusinessProvider {
  sendMessageTemplate(phone: string, templateName: string, vars: string[]): Promise<boolean>;
  receiveIncomingMessage(webhookData: any): Promise<Communication>;
}

export interface EmailServiceProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  syncInbox(userId: string): Promise<Communication[]>;
}

export interface CalendarSyncProvider {
  createEvent(meeting: Meeting): Promise<string>; // returns provider event id
  deleteEvent(eventId: string): Promise<boolean>;
}

export interface GoogleContactsProvider {
  syncContacts(userId: string): Promise<number>;
}

export interface OutlookContactsProvider {
  syncContacts(userId: string): Promise<number>;
}
