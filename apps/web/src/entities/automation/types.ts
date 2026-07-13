export type TriggerType = 'manual' | 'scheduled' | 'event' | 'ai' | 'webhook';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type WorkflowStatus = 'active' | 'inactive' | 'running' | 'completed' | 'failed';

export type NotificationChannel = 'in-app' | 'push' | 'email' | 'whatsapp' | 'sms';
