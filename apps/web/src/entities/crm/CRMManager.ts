import {
  Lead,
  Customer,
  Task,
  Reminder,
  Meeting,
  Activity,
  Communication,
  Document,
  Note
} from './interfaces';
import { TaskType, DocumentCategory, NoteType, CommunicationChannel, CommunicationDirection } from './types';
import { crmEventEmitter, CRMEvents } from './events';
import {
  InvalidCustomerError,
  InvalidLeadError,
  DuplicateCustomerError,
  DuplicateLeadError,
  MissingDocumentError,
  InvalidPipelineStageError
} from './errors';
import { CRMUtils } from './utils';
import { LeadScoringEngine } from './leadScoring';
import { reminderEngine } from './reminder';
import { CRMAnalytics } from './analytics';

// Integrations
import { authenticationManager } from '../../shared/auth';
import { memoryManager } from '../../shared/memory';
import { notificationManager } from '../../shared/dashboard';
import { serviceRegistry } from '../../shared/providers';

export class CRMManager {
  private leads = new Map<string, Lead>();
  private customers = new Map<string, Customer>();
  private tasks = new Map<string, Task>();
  private meetings = new Map<string, Meeting>();
  private activities: Activity[] = [];
  private communications: Communication[] = [];
  private documents = new Map<string, Document>();
  private notes = new Map<string, Note[]>();

  constructor() {
    this.loadData();
    this.checkReminders();
  }

  private loadData() {
    try {
      const storedLeads = localStorage.getItem('jarvis_crm_leads');
      if (storedLeads) {
        const list = JSON.parse(storedLeads) as Lead[];
        list.forEach((l) => this.leads.set(l.id, l));
      }

      const storedCustomers = localStorage.getItem('jarvis_crm_customers');
      if (storedCustomers) {
        const list = JSON.parse(storedCustomers) as Customer[];
        list.forEach((c) => this.customers.set(c.id, c));
      }

      const storedTasks = localStorage.getItem('jarvis_crm_tasks');
      if (storedTasks) {
        const list = JSON.parse(storedTasks) as Task[];
        list.forEach((t) => this.tasks.set(t.id, t));
      }

      const storedMeetings = localStorage.getItem('jarvis_crm_meetings');
      if (storedMeetings) {
        const list = JSON.parse(storedMeetings) as Meeting[];
        list.forEach((m) => this.meetings.set(m.id, m));
      }

      const storedActivities = localStorage.getItem('jarvis_crm_activities');
      if (storedActivities) {
        this.activities = JSON.parse(storedActivities) as Activity[];
      }

      const storedComms = localStorage.getItem('jarvis_crm_communications');
      if (storedComms) {
        this.communications = JSON.parse(storedComms) as Communication[];
      }

      const storedDocs = localStorage.getItem('jarvis_crm_documents');
      if (storedDocs) {
        const list = JSON.parse(storedDocs) as Document[];
        list.forEach((d) => this.documents.set(d.id, d));
      }

      const storedNotes = localStorage.getItem('jarvis_crm_notes');
      if (storedNotes) {
        const list = JSON.parse(storedNotes) as [string, Note[]][];
        this.notes = new Map(list);
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_crm_leads', JSON.stringify(Array.from(this.leads.values())));
      localStorage.setItem('jarvis_crm_customers', JSON.stringify(Array.from(this.customers.values())));
      localStorage.setItem('jarvis_crm_tasks', JSON.stringify(Array.from(this.tasks.values())));
      localStorage.setItem('jarvis_crm_meetings', JSON.stringify(Array.from(this.meetings.values())));
      localStorage.setItem('jarvis_crm_activities', JSON.stringify(this.activities));
      localStorage.setItem('jarvis_crm_communications', JSON.stringify(this.communications));
      localStorage.setItem('jarvis_crm_documents', JSON.stringify(Array.from(this.documents.values())));
      localStorage.setItem('jarvis_crm_notes', JSON.stringify(Array.from(this.notes.entries())));
    } catch (_) { /* ignore */ }
  }

  private getActiveAgentId(): string {
    return authenticationManager.getCurrentUser()?.id || 'agent_system';
  }

  // ─── LEADS ENGINE ───────────────────────────────────────────

  public createLead(name: string, email: string, phone: string, source = 'Website', manualScore = 5): Lead {
    for (const lead of this.leads.values()) {
      if (lead.email === email || lead.phone === phone) {
        throw new DuplicateLeadError(email || phone);
      }
    }

    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const ownerId = this.getActiveAgentId();

    const newLead: Lead = {
      id,
      name,
      email,
      phone,
      source,
      status: 'New Lead',
      score: manualScore,
      tags: [],
      ownerId,
      financialScore: 5,
      engagementScore: 0,
      priorityScore: manualScore,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const sourcePoints = CRMUtils.calculateSourcePoints(source);
    newLead.priorityScore = LeadScoringEngine.calculatePriorityScore(0, 5, sourcePoints, manualScore);
    newLead.score = Math.round(newLead.priorityScore);

    this.leads.set(id, newLead);
    this.saveData();

    this.logActivity(id, undefined, 'status_change', 'Lead Created', `Lead for ${name} registered via ${source}.`);
    
    crmEventEmitter.emit(CRMEvents.LEAD_CREATED, newLead);
    this.syncToMemory(`lead_${id}`, newLead, ['lead', 'contact']);

    return newLead;
  }

  public updateLead(leadId: string, updates: Partial<Lead>): Lead {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new InvalidLeadError(leadId, 'Lead not found.');
    }

    const oldStatus = lead.status;
    Object.assign(lead, updates);
    lead.updatedAt = Date.now();

    if (updates.status && updates.status !== oldStatus) {
      if (!CRMUtils.isValidStage(updates.status)) {
        throw new InvalidPipelineStageError(updates.status);
      }

      this.logActivity(
        leadId,
        undefined,
        'status_change',
        'Lead Status Transited',
        `Lead status moved from "${oldStatus}" to "${updates.status}".`
      );

      if (updates.status === 'Qualified') {
        notificationManager.showNotification('info', 'Lead Qualified', `Lead ${lead.name} has been marked as Qualified.`);
      } else if (updates.status === 'Won') {
        notificationManager.showNotification('success', 'Lead Won!', `Congratulations! Deal won for ${lead.name}.`);
        this.promoteLeadToCustomer(lead);
      }
    }

    const sourcePoints = CRMUtils.calculateSourcePoints(lead.source);
    const engagementActivities = this.activities.filter((a) => a.leadId === leadId).length;
    lead.engagementScore = LeadScoringEngine.calculateEngagementScore(engagementActivities);
    lead.priorityScore = LeadScoringEngine.calculatePriorityScore(
      lead.engagementScore,
      lead.financialScore,
      sourcePoints,
      lead.score
    );

    this.leads.set(leadId, lead);
    this.saveData();

    crmEventEmitter.emit(CRMEvents.LEAD_UPDATED, lead);
    this.syncToMemory(`lead_${leadId}`, lead, ['lead', 'updated']);

    return lead;
  }

  public deleteLead(leadId: string) {
    if (!this.leads.has(leadId)) {
      throw new InvalidLeadError(leadId, 'Lead not found.');
    }
    this.leads.delete(leadId);
    this.saveData();
  }

  public getLead(leadId: string): Lead {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new InvalidLeadError(leadId, 'Lead not found.');
    }
    return lead;
  }

  public assignLead(leadId: string, ownerId: string): Lead {
    const lead = this.getLead(leadId);
    lead.ownerId = ownerId;
    lead.updatedAt = Date.now();
    this.leads.set(leadId, lead);
    this.saveData();

    this.logActivity(leadId, undefined, 'status_change', 'Lead Assigned', `Lead assigned to agent ${ownerId}.`);
    
    crmEventEmitter.emit(CRMEvents.LEAD_ASSIGNED, { leadId, ownerId });
    return lead;
  }

  // ─── CUSTOMER ENGINE ────────────────────────────────────────

  public createCustomer(
    fullName: string,
    email: string,
    phone: string,
    occupation: string,
    spouse?: string,
    dependentsCount?: number,
    financialProfileId?: string
  ): Customer {
    for (const cust of this.customers.values()) {
      if (cust.email === email || cust.phone === phone) {
        throw new DuplicateCustomerError(email || phone);
      }
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newCustomer: Customer = {
      id,
      fullName,
      email,
      phone,
      occupation,
      familyDetails: {
        spouse,
        dependentsCount
      },
      financialProfileId,
      customFields: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.customers.set(id, newCustomer);
    this.saveData();

    this.logActivity(undefined, id, 'status_change', 'Customer Profile Created', `Customer registration complete for ${fullName}.`);

    crmEventEmitter.emit(CRMEvents.CUSTOMER_CREATED, newCustomer);
    this.syncToMemory(`customer_${id}`, newCustomer, ['customer', 'profile']);

    return newCustomer;
  }

  public updateCustomer(customerId: string, updates: Partial<Customer>): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new InvalidCustomerError(customerId, 'Customer not found.');
    }

    Object.assign(customer, updates);
    customer.updatedAt = Date.now();

    this.customers.set(customerId, customer);
    this.saveData();

    this.syncToMemory(`customer_${customerId}`, customer, ['customer', 'updated']);

    return customer;
  }

  public getCustomer(customerId: string): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new InvalidCustomerError(customerId, 'Customer not found.');
    }
    return customer;
  }

  private promoteLeadToCustomer(lead: Lead) {
    try {
      this.createCustomer(
        lead.name,
        lead.email,
        lead.phone,
        'Occupation Unspecified',
        undefined,
        undefined,
        lead.id
      );
    } catch (_) { /* ignore duplicates */ }
  }

  // ─── TASK MANAGER ───────────────────────────────────────────

  public createTask(
    title: string,
    description: string,
    type: TaskType,
    priority: 'low' | 'medium' | 'high',
    deadline: number,
    leadId?: string,
    customerId?: string
  ): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newTask: Task = {
      id,
      leadId,
      customerId,
      type,
      title,
      description,
      deadline,
      priority,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tasks.set(id, newTask);
    this.saveData();

    this.logActivity(leadId, customerId, 'whatsapp', 'Task Created', `New Task: ${title}. Deadline: ${CRMUtils.formatDate(deadline)}.`);

    reminderEngine.addReminder({
      userId: this.getActiveAgentId(),
      leadId,
      customerId,
      type: 'follow-up',
      title: `Task Deadline: ${title}`,
      description: `Task "${title}" is due soon.`,
      triggerTime: deadline - 2 * 3600 * 1000
    });

    crmEventEmitter.emit(CRMEvents.TASK_CREATED, newTask);
    return newTask;
  }

  public completeTask(taskId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found.`);
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.updatedAt = Date.now();

    this.tasks.set(taskId, task);
    this.saveData();

    this.logActivity(task.leadId, task.customerId, 'whatsapp', 'Task Completed', `Completed task: ${task.title}.`);

    crmEventEmitter.emit(CRMEvents.TASK_COMPLETED, task);
    return task;
  }

  public getTasks(leadId?: string, customerId?: string): Task[] {
    const list = Array.from(this.tasks.values());
    if (leadId) return list.filter((t) => t.leadId === leadId);
    if (customerId) return list.filter((t) => t.customerId === customerId);
    return list;
  }

  // ─── MEETING SCHEDULER ──────────────────────────────────────

  public scheduleMeeting(
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    leadId?: string,
    customerId?: string,
    location = 'Virtual Video Conference'
  ): Meeting {
    const id = `meet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newMeeting: Meeting = {
      id,
      leadId,
      customerId,
      title,
      description,
      startTime,
      endTime,
      location,
      status: 'scheduled',
      createdAt: Date.now()
    };

    this.meetings.set(id, newMeeting);
    this.saveData();

    this.logActivity(leadId, customerId, 'meeting', 'Meeting Scheduled', `Meeting: "${title}" scheduled on ${CRMUtils.formatDate(startTime)} at ${location}.`);

    reminderEngine.addReminder({
      userId: this.getActiveAgentId(),
      leadId,
      customerId,
      type: 'meeting',
      title: `Upcoming Meeting: ${title}`,
      description: `Meeting starts in 15 minutes at ${location}.`,
      triggerTime: startTime - 15 * 60 * 1000
    });

    crmEventEmitter.emit(CRMEvents.MEETING_SCHEDULED, newMeeting);
    return newMeeting;
  }

  // ─── DOCUMENT MANAGER ───────────────────────────────────────

  public uploadDocument(
    name: string,
    category: DocumentCategory,
    fileUrl: string,
    leadId?: string,
    customerId?: string
  ): Document {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newDoc: Document = {
      id,
      leadId,
      customerId,
      name,
      category,
      uploadDate: Date.now(),
      fileUrl
    };

    this.documents.set(id, newDoc);
    this.saveData();

    this.logActivity(leadId, customerId, 'document', 'Document Uploaded', `Document: ${name} (${category}) uploaded.`);

    crmEventEmitter.emit(CRMEvents.DOCUMENT_UPLOADED, newDoc);
    return newDoc;
  }

  public getDocuments(leadId?: string, customerId?: string): Document[] {
    const list = Array.from(this.documents.values());
    if (leadId) return list.filter((d) => d.leadId === leadId);
    if (customerId) return list.filter((d) => d.customerId === customerId);
    return list;
  }

  public deleteDocument(docId: string) {
    if (!this.documents.has(docId)) {
      throw new MissingDocumentError(docId);
    }
    this.documents.delete(docId);
    this.saveData();
  }

  public async simulateOCR(docId: string): Promise<Document> {
    const doc = this.documents.get(docId);
    if (!doc) {
      throw new MissingDocumentError(docId);
    }

    doc.ocrText = `CRM KYC DOCUMENT SCAN\nDocument Name: ${doc.name}\nCategory: ${doc.category}\nUpload Date: ${CRMUtils.formatDate(doc.uploadDate)}\nVerified: Yes\nCountry: USA`;
    this.documents.set(docId, doc);
    this.saveData();

    this.logActivity(doc.leadId, doc.customerId, 'document', 'OCR Extraction Completed', `Simulated OCR text extraction for document ${doc.name}.`);

    return doc;
  }

  // ─── TIMELINE & COMMUNICATIONS ──────────────────────────────

  public logActivity(
    leadId: string | undefined,
    customerId: string | undefined,
    type: Activity['type'],
    title: string,
    description: string,
    metadata?: Record<string, any>
  ) {
    const newActivity: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      leadId,
      customerId,
      type,
      title,
      description,
      timestamp: Date.now(),
      metadata
    };
    this.activities.push(newActivity);
    this.saveData();
  }

  public getCustomerTimeline(customerId?: string, leadId?: string): Activity[] {
    return this.activities
      .filter((a) => (customerId && a.customerId === customerId) || (leadId && a.leadId === leadId))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public addCommunicationLog(
    channel: CommunicationChannel,
    direction: CommunicationDirection,
    sender: string,
    recipient: string,
    content: string,
    leadId?: string,
    customerId?: string,
    subject?: string,
    durationSeconds?: number
  ): Communication {
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newComm: Communication = {
      id,
      leadId,
      customerId,
      channel,
      direction,
      sender,
      recipient,
      subject,
      content,
      timestamp: Date.now(),
      durationSeconds
    };

    this.communications.push(newComm);
    this.saveData();

    const details = direction === 'outbound' ? `Sent ${channel} to ${recipient}` : `Received ${channel} from ${sender}`;
    this.logActivity(leadId, customerId, channel as any, `${channel.toUpperCase()} Logged`, `${details}: "${content.substring(0, 60)}..."`);

    if (leadId) {
      const lead = this.leads.get(leadId);
      if (lead) {
        const leadNotes = this.notes.get(leadId)?.map((n) => n.content) || [];
        const contentHistory = [...leadNotes, content];
        
        LeadScoringEngine.calculateAIScore(lead, contentHistory).then((aiScore) => {
          const sourcePoints = CRMUtils.calculateSourcePoints(lead.source);
          const engagementActivities = this.activities.filter((a) => a.leadId === leadId).length;
          lead.engagementScore = LeadScoringEngine.calculateEngagementScore(engagementActivities);
          lead.priorityScore = LeadScoringEngine.calculatePriorityScore(
            lead.engagementScore,
            lead.financialScore,
            sourcePoints,
            aiScore
          );
          lead.score = Math.round(lead.priorityScore);
          this.leads.set(leadId, lead);
          this.saveData();
        });
      }
    }

    return newComm;
  }

  // ─── CUSTOMER NOTES ──────────────────────────────────────────

  public addNote(content: string, type: NoteType, leadId?: string, customerId?: string): Note {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const authorId = this.getActiveAgentId();
    
    const newNote: Note = {
      id,
      leadId,
      customerId,
      type,
      content,
      authorId,
      timestamp: Date.now()
    };

    const targetKey = leadId || customerId || 'general';
    const list = this.notes.get(targetKey) || [];
    list.push(newNote);
    this.notes.set(targetKey, list);
    this.saveData();

    this.logActivity(leadId, customerId, 'note', 'Note Added', `${type.toUpperCase()} note created by ${authorId}.`);

    return newNote;
  }

  public getNotes(leadId?: string, customerId?: string): Note[] {
    const targetKey = leadId || customerId || 'general';
    return this.notes.get(targetKey) || [];
  }

  // ─── REMINDERS INTERACTION ──────────────────────────────────

  public addReminder(reminder: Omit<Reminder, 'id' | 'isFired' | 'createdAt'>): Reminder {
    return reminderEngine.addReminder(reminder);
  }

  public getReminders(userId?: string): Reminder[] {
    return reminderEngine.getReminders(userId);
  }

  public checkReminders(): number {
    return reminderEngine.checkReminders();
  }

  // ─── SEARCH CRM ──────────────────────────────────────────────

  public searchCRM(query: string): {
    leads: Lead[];
    customers: Customer[];
    documents: Document[];
    activities: Activity[];
  } {
    const leadsResult: Lead[] = [];
    const customersResult: Customer[] = [];
    const documentsResult: Document[] = [];
    const activitiesResult: Activity[] = [];

    for (const lead of this.leads.values()) {
      if (
        CRMUtils.containsKeyword(lead.name, query) ||
        CRMUtils.containsKeyword(lead.email, query) ||
        CRMUtils.containsKeyword(lead.phone, query) ||
        CRMUtils.containsKeyword(lead.source, query)
      ) {
        leadsResult.push(lead);
      }
    }

    for (const cust of this.customers.values()) {
      if (
        CRMUtils.containsKeyword(cust.fullName, query) ||
        CRMUtils.containsKeyword(cust.email, query) ||
        CRMUtils.containsKeyword(cust.phone, query) ||
        CRMUtils.containsKeyword(cust.occupation, query)
      ) {
        customersResult.push(cust);
      }
    }

    for (const doc of this.documents.values()) {
      if (
        CRMUtils.containsKeyword(doc.name, query) ||
        CRMUtils.containsKeyword(doc.category, query) ||
        (doc.ocrText && CRMUtils.containsKeyword(doc.ocrText, query))
      ) {
        documentsResult.push(doc);
      }
    }

    this.activities.forEach((act) => {
      if (CRMUtils.containsKeyword(act.title, query) || CRMUtils.containsKeyword(act.description, query)) {
        activitiesResult.push(act);
      }
    });

    return {
      leads: leadsResult,
      customers: customersResult,
      documents: documentsResult,
      activities: activitiesResult
    };
  }

  // ─── ANALYTICS REPORT ────────────────────────────────────────

  public getAnalyticsReport() {
    const leadsArray = Array.from(this.leads.values());
    const customersArray = Array.from(this.customers.values());
    const tasksArray = Array.from(this.tasks.values());
    
    return CRMAnalytics.calculateAnalytics(
      leadsArray,
      customersArray,
      tasksArray,
      this.activities
    );
  }

  // ─── PRIVATE INTERNALS ───────────────────────────────────────

  private async syncToMemory(key: string, value: any, tags: string[]) {
    try {
      await memoryManager.saveMemory(
        key,
        JSON.stringify(value),
        'fact',
        'persistent',
        7,
        tags
      );
    } catch (_) { /* ignore */ }
  }
}

export const crmManager = new CRMManager();
serviceRegistry.register('crmManager', crmManager);
export default crmManager;
