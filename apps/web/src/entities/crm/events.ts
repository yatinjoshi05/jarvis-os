export const CRMEvents = {
  LEAD_CREATED: 'crm:lead_created',
  LEAD_UPDATED: 'crm:lead_updated',
  LEAD_ASSIGNED: 'crm:lead_assigned',
  CUSTOMER_CREATED: 'crm:customer_created',
  TASK_CREATED: 'crm:task_created',
  TASK_COMPLETED: 'crm:task_completed',
  MEETING_SCHEDULED: 'crm:meeting_scheduled',
  DOCUMENT_UPLOADED: 'crm:document_uploaded',
  FOLLOWUP_CREATED: 'crm:followup_created'
} as const;

export type CRMEvent = typeof CRMEvents[keyof typeof CRMEvents];

type CRMEventListener = (data: any) => void;

class CRMEventEmitter {
  private listeners: Map<string, Set<CRMEventListener>> = new Map();

  public on(event: string, listener: CRMEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: CRMEventListener) {
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
          console.error(`Error in CRM event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const crmEventEmitter = new CRMEventEmitter();
export default crmEventEmitter;
