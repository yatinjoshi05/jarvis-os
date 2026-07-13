export const AutomationEvents = {
  WORKFLOW_CREATED: 'automation:workflow_created',
  WORKFLOW_STARTED: 'automation:workflow_started',
  WORKFLOW_COMPLETED: 'automation:workflow_completed',
  WORKFLOW_FAILED: 'automation:workflow_failed',
  JOB_QUEUED: 'automation:job_queued',
  JOB_COMPLETED: 'automation:job_completed',
  EMAIL_SENT: 'automation:email_sent',
  WHATSAPP_SENT: 'automation:whatsapp_sent',
  SMS_SENT: 'automation:sms_sent',
  NOTIFICATION_SENT: 'automation:notification_sent'
} as const;

export type AutomationEvent = typeof AutomationEvents[keyof typeof AutomationEvents];

type AutomationEventListener = (data: any) => void;

class AutomationEventEmitter {
  private listeners: Map<string, Set<AutomationEventListener>> = new Map();

  public on(event: string, listener: AutomationEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: AutomationEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  public emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in Automation event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const automationEventEmitter = new AutomationEventEmitter();
export default automationEventEmitter;
