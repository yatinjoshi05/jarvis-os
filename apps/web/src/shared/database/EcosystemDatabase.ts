export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  city: string;
  source: string;
  service: string;
  budget: string;
  status: 'new' | 'contacted' | 'analyzed' | 'qualified' | 'won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  qualification: 'hot' | 'warm' | 'cold';
  intent: number;
  value: string;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  phone: string;
  name: string;
  message: string;
  ai_reply: string;
  intent: string;
  direction: 'inbound' | 'outbound';
  status: 'delivered' | 'sent' | 'received' | 'failed';
  created_at: string;
}

export interface EmailRecord {
  id: string;
  from_name: string;
  from_email: string;
  subject: string;
  body: string;
  ai_reply?: string;
  category: string;
  priority: string;
  status: 'open' | 'resolved' | 'pending';
  escalated: boolean;
  created_at: string;
}

export interface CallRecord {
  call_id: string;
  phone: string;
  duration: string;
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
  deal_stage: string;
  rating: number;
  recording_url?: string;
  transcript?: string;
  created_at: string;
}

export interface ProposalRecord {
  id: string;
  lead_id: string;
  client: string;
  company: string;
  value: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  created_at: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  cron?: string;
  time?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  assigned_agent?: string;
  created_at: string;
}

export interface AnalyticsRecord {
  timestamp: string;
  total_leads: number;
  hot_leads: number;
  revenue: number;
  messages_count: number;
  calls_count: number;
  tickets_count: number;
  conversion_rate: number;
}

export interface NotificationRecord {
  id: string;
  channel: 'telegram' | 'in-app' | 'whatsapp' | 'email';
  title: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
}

export interface AutomationNodeRecord {
  id: string;
  name: string;
  status: 'ONLINE' | 'BUSY' | 'DISCONNECTED' | 'ERROR';
  latency_ms: number;
  error_count: number;
  tokens_used: number;
  memory_bytes: number;
  logs: string[];
}

export interface ReportRecord {
  id: string;
  title: string;
  period: string;
  summary: string;
  generated_at: string;
}

export interface MemoryVectorRecord {
  id: string;
  context: string;
  type: string;
  score: number;
  timestamp: string;
}

export class EcosystemDatabase {
  private static instance: EcosystemDatabase;

  private leadsMap = new Map<string, LeadRecord>();
  private messagesMap = new Map<string, MessageRecord>();
  private emailsMap = new Map<string, EmailRecord>();
  private callsMap = new Map<string, CallRecord>();
  private proposalsMap = new Map<string, ProposalRecord>();
  private tasksMap = new Map<string, TaskRecord>();
  private analyticsMap = new Map<string, AnalyticsRecord>();
  private notificationsMap = new Map<string, NotificationRecord>();
  private automationsMap = new Map<string, AutomationNodeRecord>();
  private reportsMap = new Map<string, ReportRecord>();
  private memoryMap = new Map<string, MemoryVectorRecord>();

  private subscribers: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): EcosystemDatabase {
    if (!EcosystemDatabase.instance) {
      EcosystemDatabase.instance = new EcosystemDatabase();
    }
    return EcosystemDatabase.instance;
  }

  private loadFromStorage() {
    try {
      const get = (key: string) => {
        const raw = localStorage.getItem(`jarvis_db_${key}`);
        return raw ? JSON.parse(raw) : [];
      };

      (get('leads') as LeadRecord[]).forEach(r => this.leadsMap.set(r.id, r));
      (get('messages') as MessageRecord[]).forEach(r => this.messagesMap.set(r.id, r));
      (get('emails') as EmailRecord[]).forEach(r => this.emailsMap.set(r.id, r));
      (get('calls') as CallRecord[]).forEach(r => this.callsMap.set(r.call_id, r));
      (get('proposals') as ProposalRecord[]).forEach(r => this.proposalsMap.set(r.id, r));
      (get('tasks') as TaskRecord[]).forEach(r => this.tasksMap.set(r.id, r));
      (get('analytics') as AnalyticsRecord[]).forEach(r => this.analyticsMap.set(r.timestamp, r));
      (get('notifications') as NotificationRecord[]).forEach(r => this.notificationsMap.set(r.id, r));
      (get('automations') as AutomationNodeRecord[]).forEach(r => this.automationsMap.set(r.id, r));
      (get('reports') as ReportRecord[]).forEach(r => this.reportsMap.set(r.id, r));
      (get('memory') as MemoryVectorRecord[]).forEach(r => this.memoryMap.set(r.id, r));
    } catch (e) {
      console.error('[EcosystemDatabase] Error loading from storage:', e);
    }
  }

  private persist(table: string, data: any[]) {
    try {
      localStorage.setItem(`jarvis_db_${table}`, JSON.stringify(data));
      this.notifySubscribers();
    } catch (e) {
      console.error(`[EcosystemDatabase] Error persisting table ${table}:`, e);
    }
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  // --- LEADS ---
  public getLeads(): LeadRecord[] { return Array.from(this.leadsMap.values()); }
  public saveLead(lead: LeadRecord): void {
    this.leadsMap.set(lead.id, lead);
    this.persist('leads', this.getLeads());
  }

  // --- MESSAGES ---
  public getMessages(): MessageRecord[] { return Array.from(this.messagesMap.values()); }
  public saveMessage(msg: MessageRecord): void {
    this.messagesMap.set(msg.id, msg);
    this.persist('messages', this.getMessages());
  }

  // --- EMAILS ---
  public getEmails(): EmailRecord[] { return Array.from(this.emailsMap.values()); }
  public saveEmail(email: EmailRecord): void {
    this.emailsMap.set(email.id, email);
    this.persist('emails', this.getEmails());
  }

  // --- CALLS ---
  public getCalls(): CallRecord[] { return Array.from(this.callsMap.values()); }
  public saveCall(call: CallRecord): void {
    this.callsMap.set(call.call_id, call);
    this.persist('calls', this.getCalls());
  }

  // --- PROPOSALS ---
  public getProposals(): ProposalRecord[] { return Array.from(this.proposalsMap.values()); }
  public saveProposal(proposal: ProposalRecord): void {
    this.proposalsMap.set(proposal.id, proposal);
    this.persist('proposals', this.getProposals());
  }

  // --- TASKS ---
  public getTasks(): TaskRecord[] { return Array.from(this.tasksMap.values()); }
  public saveTask(task: TaskRecord): void {
    this.tasksMap.set(task.id, task);
    this.persist('tasks', this.getTasks());
  }

  // --- ANALYTICS ---
  public getAnalytics(): AnalyticsRecord[] { return Array.from(this.analyticsMap.values()); }
  public saveAnalytics(record: AnalyticsRecord): void {
    this.analyticsMap.set(record.timestamp, record);
    this.persist('analytics', this.getAnalytics());
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): NotificationRecord[] { return Array.from(this.notificationsMap.values()); }
  public saveNotification(n: NotificationRecord): void {
    this.notificationsMap.set(n.id, n);
    this.persist('notifications', this.getNotifications());
  }

  // --- AUTOMATIONS ---
  public getAutomations(): AutomationNodeRecord[] { return Array.from(this.automationsMap.values()); }
  public saveAutomationNode(node: AutomationNodeRecord): void {
    this.automationsMap.set(node.id, node);
    this.persist('automations', this.getAutomations());
  }

  // --- REPORTS ---
  public getReports(): ReportRecord[] { return Array.from(this.reportsMap.values()); }
  public saveReport(report: ReportRecord): void {
    this.reportsMap.set(report.id, report);
    this.persist('reports', this.getReports());
  }

  // --- MEMORY ---
  public getMemory(): MemoryVectorRecord[] { return Array.from(this.memoryMap.values()); }
  public saveMemory(vector: MemoryVectorRecord): void {
    this.memoryMap.set(vector.id, vector);
    this.persist('memory', this.getMemory());
  }
}

export const ecosystemDb = EcosystemDatabase.getInstance();
