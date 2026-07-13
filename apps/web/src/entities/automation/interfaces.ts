import { TriggerType, JobStatus, WorkflowStatus, NotificationChannel } from './types';

export interface Trigger {
  type: TriggerType;
  cronExpression?: string; // for scheduled triggers
  eventName?: string;      // for event triggers (e.g. crm:lead_created)
  webhookId?: string;      // for webhook triggers
  aiIntent?: string;       // for AI intent matching
}

export interface WorkflowStep {
  id: string;
  type: 'email' | 'whatsapp' | 'sms' | 'notification' | 'webhook' | 'delay';
  payload: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: Trigger;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  version: number;
  retrySettings: {
    maxRetries: number;
    delayMs: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  currentStepIndex: number;
  history: { stepId: string; status: string; timestamp: number; error?: string }[];
  startedAt: number;
  completedAt?: number;
}

export interface Job {
  id: string;
  workflowId?: string;
  type: string; // e.g. send_email, execute_webhook
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  errorLog?: string;
  executeAfter?: number; // delayed execution timestamp
  createdAt: number;
  updatedAt: number;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  channels: NotificationChannel[];
  title: string;
  message: string;
  timestamp: number;
  isMock?: boolean;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: { filename: string; url: string }[];
  templateId?: string;
  templateVars?: Record<string, any>;
  isMock?: boolean;
}

export interface WhatsAppPayload {
  phone: string;
  message?: string;
  templateId?: string;
  templateVars?: Record<string, any>;
  attachments?: { filename: string; url: string }[];
  isMock?: boolean;
}

export interface SMSPayload {
  phone: string;
  message: string;
  type: 'OTP' | 'alert';
  isMock?: boolean;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  active: boolean;
  retryCount: number;
  createdAt: number;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  direction: 'incoming' | 'outgoing';
  payload: any;
  status: 'success' | 'failed';
  statusCode?: number;
  timestamp: number;
  error?: string;
}

export interface Template {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'notification';
  subjectTemplate?: string;
  bodyTemplate: string;
}

// Future Compatibility Interfaces for automation scaling
export interface N8NIntegrationProvider {
  triggerWorkflow(n8nWorkflowId: string, data: any): Promise<boolean>;
}

export interface ZapierIntegrationProvider {
  triggerZap(zapHookUrl: string, data: any): Promise<boolean>;
}

export interface MakeIntegrationProvider {
  triggerScenario(makeScenarioUrl: string, data: any): Promise<boolean>;
}

export interface LangGraphIntegrationProvider {
  triggerGraphExecution(graphId: string, inputState: any): Promise<any>;
}

export interface MCPIntegrationProvider {
  callMCPTool(serverName: string, toolName: string, args: any): Promise<any>;
}

export interface CloudTasksProvider {
  createTask(queueName: string, url: string, payload: any, scheduleTime?: number): Promise<string>;
}

export interface KafkaProvider {
  produceEvent(topic: string, key: string, payload: any): Promise<boolean>;
}

export interface RabbitMQProvider {
  publishMessage(exchange: string, routingKey: string, message: any): Promise<boolean>;
}

export interface EnterpriseWorkflowEngine {
  deployBpmnWorkflow(bpmnXml: string): Promise<string>;
  startProcessInstance(processId: string, variables: any): Promise<string>;
}
