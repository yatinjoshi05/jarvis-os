import {
  Workflow,
  WorkflowRun,
  Trigger,
  Job,
  NotificationPayload,
  EmailPayload,
  WhatsAppPayload,
  SMSPayload,
  Webhook
} from './interfaces';
import { queueManager } from './queue';
import { backgroundWorker } from './worker';
import { webhookManager } from './webhook';
import { emailService, whatsappService, smsService, notificationEngine } from './services';
import { automationEventEmitter, AutomationEvents } from './events';
import { InvalidWorkflowError } from './errors';
import { AutomationUtils } from './utils';

// Core Integrations
import { memoryManager } from '../../shared/memory';
import { notificationManager } from '../../shared/dashboard';
import { serviceRegistry } from '../../shared/providers';

// CRM & Financial OS Events Integrations
import { crmEventEmitter, CRMEvents } from '../crm';
import { financialEventEmitter, FinancialEntityEvents } from '../financial';

export class AutomationManager {
  private workflows = new Map<string, Workflow>();
  private runs = new Map<string, WorkflowRun>();
  private logs: { timestamp: number; type: string; message: string; details?: any }[] = [];
  private cronTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadData();
    
    backgroundWorker.setRunner((job) => this.runJobPayload(job));
    backgroundWorker.start();

    this.hookCRMEvents();
    this.hookFinancialEvents();
    this.startCronLoop();

    // Seed default Welcome Notification workflow if none exist
    if (this.workflows.size === 0) {
      this.createWorkflow(
        'Lead Welcome Auto-Notification',
        { type: 'event', eventName: 'crm:lead_created' },
        [
          {
            id: 'step_welcome_email',
            type: 'email',
            payload: {
              to: '{{lead.email}}',
              subject: 'Welcome to Jarvis OS, {{lead.name}}!',
              text: 'Hello {{lead.name}},\n\nThank you for signing up. An advisor has been assigned to contact you.'
            }
          },
          {
            id: 'step_delay',
            type: 'delay',
            payload: { delayMs: 2000 }
          },
          {
            id: 'step_agent_alert',
            type: 'notification',
            payload: {
              userId: 'usr_guest',
              title: 'Action Required: New Lead',
              message: 'A new lead has registered. Please review the lead profile inside the CRM board.',
              channels: ['in-app']
            }
          }
        ]
      );
    }
  }

  private loadData() {
    try {
      const storedWfs = localStorage.getItem('jarvis_auto_workflows');
      if (storedWfs) {
        const list = JSON.parse(storedWfs) as Workflow[];
        list.forEach((w) => this.workflows.set(w.id, w));
      }
      const storedRuns = localStorage.getItem('jarvis_auto_runs');
      if (storedRuns) {
        const list = JSON.parse(storedRuns) as WorkflowRun[];
        list.forEach((r) => this.runs.set(r.runId, r));
      }
      const storedLogs = localStorage.getItem('jarvis_auto_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs) as any[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_auto_workflows', JSON.stringify(Array.from(this.workflows.values())));
      localStorage.setItem('jarvis_auto_runs', JSON.stringify(Array.from(this.runs.values())));
      localStorage.setItem('jarvis_auto_logs', JSON.stringify(this.logs));
    } catch (_) { /* ignore */ }
  }

  private log(type: string, message: string, details?: any) {
    const entry = { timestamp: Date.now(), type, message, details };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.saveData();

    memoryManager.saveMemory(
      `auto_log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      JSON.stringify(entry),
      'task',
      'transient',
      1,
      ['automation', 'log', type]
    ).catch(() => {});
  }

  // ─── CRM & FINANCIAL OS HOOKS ──────────────────────────────

  private hookCRMEvents() {
    crmEventEmitter.on(CRMEvents.LEAD_CREATED, (lead: any) => {
      this.log('event', `CRM event: LEAD_CREATED for ${lead.name}`);
      this.evaluateEventTriggers(CRMEvents.LEAD_CREATED, { lead });
    });

    crmEventEmitter.on(CRMEvents.LEAD_ASSIGNED, (data: any) => {
      this.log('event', `CRM event: LEAD_ASSIGNED to owner ${data.ownerId}`);
      this.evaluateEventTriggers(CRMEvents.LEAD_ASSIGNED, data);
    });

    crmEventEmitter.on(CRMEvents.TASK_COMPLETED, (task: any) => {
      this.log('event', `CRM event: TASK_COMPLETED for task "${task.title}"`);
      this.evaluateEventTriggers(CRMEvents.TASK_COMPLETED, { task });
    });
  }

  private hookFinancialEvents() {
    financialEventEmitter.on(FinancialEntityEvents.ENTRY_POSTED, (data: any) => {
      this.log('event', `Financial OS event: ENTRY_POSTED. Amount: $${data.transaction?.amount}`);
      this.evaluateEventTriggers(FinancialEntityEvents.ENTRY_POSTED, data);
    });

    financialEventEmitter.on(FinancialEntityEvents.GOAL_COMPLETED, (data: any) => {
      this.log('event', `Financial OS event: GOAL_COMPLETED for goal "${data.goal?.name}"`);
      this.evaluateEventTriggers(FinancialEntityEvents.GOAL_COMPLETED, data);
    });
  }

  private evaluateEventTriggers(eventName: string, contextData: any) {
    this.workflows.forEach((wf) => {
      if (wf.status === 'active' && wf.trigger.type === 'event' && wf.trigger.eventName === eventName) {
        this.log('workflow', `Auto-triggering workflow "${wf.name}" (${wf.id}) on event "${eventName}"`);
        this.executeWorkflow(wf.id, contextData).catch(() => {});
      }
    });
  }

  // ─── CRON SCHEDULER LOOP ─────────────────────────────────────

  /**
   * Starts a recurring 60-second timer that evaluates all scheduled (cron) workflows
   * and fires any whose nextRunAt timestamp is in the past or present.
   */
  public startCronLoop() {
    this.stopCronLoop();
    this.cronTimer = setInterval(() => {
      const now = Date.now();
      this.workflows.forEach((wf) => {
        if (wf.status !== 'active' || wf.trigger.type !== 'scheduled') return;
        const cronExpr = wf.trigger.cronExpression;
        if (!cronExpr) return;

        // Initialize nextRunAt on first tick if not set
        const nextRunAt: number = (wf as any).nextRunAt ?? AutomationUtils.parseCronToNextTime(cronExpr);
        if ((wf as any).nextRunAt === undefined) {
          (wf as any).nextRunAt = nextRunAt;
          this.workflows.set(wf.id, wf);
          this.saveData();
          return;
        }

        if (now >= nextRunAt) {
          this.log('cron', `Cron workflow "${wf.name}" triggered at ${new Date(now).toISOString()}`);
          this.executeWorkflow(wf.id, { cronFiredAt: now }).catch(() => {});
          // Advance to the next scheduled occurrence
          (wf as any).nextRunAt = AutomationUtils.parseCronToNextTime(cronExpr);
          this.workflows.set(wf.id, wf);
          this.saveData();
        }
      });
    }, 60000); // Check every 60 seconds (1 minute)
  }

  public stopCronLoop() {
    if (this.cronTimer) {
      clearInterval(this.cronTimer);
      this.cronTimer = null;
    }
  }

  // ─── PUBLIC WORKFLOW API ────────────────────────────────────

  public createWorkflow(name: string, trigger: Trigger, steps: Workflow['steps'], retrySettings = { maxRetries: 3, delayMs: 5000 }): Workflow {
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newWorkflow: Workflow = {
      id,
      name,
      trigger,
      steps,
      status: 'active',
      version: 1,
      retrySettings,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.workflows.set(id, newWorkflow);
    this.saveData();

    this.log('workflow', `Workflow "${name}" created successfully.`, { id });
    automationEventEmitter.emit(AutomationEvents.WORKFLOW_CREATED, newWorkflow);

    return newWorkflow;
  }

  public async executeWorkflow(workflowId: string, contextData: Record<string, any> = {}): Promise<WorkflowRun> {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status === 'inactive') {
      throw new InvalidWorkflowError(workflowId, 'Workflow not found or inactive.');
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const run: WorkflowRun = {
      runId,
      workflowId,
      status: 'running',
      currentStepIndex: 0,
      history: [],
      startedAt: Date.now()
    };

    this.runs.set(runId, run);
    this.saveData();

    this.log('workflow', `Executing workflow "${wf.name}" (${workflowId})`, { runId });
    automationEventEmitter.emit(AutomationEvents.WORKFLOW_STARTED, run);

    this.executeWorkflowStep(runId, 0, contextData);

    return run;
  }

  public cancelWorkflow(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'running') return false;

    run.status = 'failed';
    run.completedAt = Date.now();
    run.history.push({
      stepId: 'cancellation',
      status: 'cancelled',
      timestamp: Date.now()
    });

    this.runs.set(runId, run);
    this.saveData();

    this.log('workflow', `Workflow run ${runId} was cancelled by user.`);
    return true;
  }

  private async executeWorkflowStep(runId: string, stepIndex: number, contextData: Record<string, any>) {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'running') return;

    const wf = this.workflows.get(run.workflowId)!;
    if (stepIndex >= wf.steps.length) {
      run.status = 'completed';
      run.completedAt = Date.now();
      this.runs.set(runId, run);
      this.saveData();

      this.log('workflow', `Workflow "${wf.name}" completed successfully.`, { runId });
      automationEventEmitter.emit(AutomationEvents.WORKFLOW_COMPLETED, run);
      
      notificationManager.showNotification('success', 'Workflow Succeeded', `Automation workflow "${wf.name}" completed.`);
      return;
    }

    const step = wf.steps[stepIndex];
    run.currentStepIndex = stepIndex;

    const interpolatedPayload = JSON.parse(
      AutomationUtils.interpolate(JSON.stringify(step.payload), contextData)
    );

    if (step.type === 'delay') {
      const delayMs = interpolatedPayload.delayMs || 5000;
      this.log('step', `Step ${step.id} (Delay) starting. Waiting ${delayMs}ms.`, { runId });
      
      run.history.push({ stepId: step.id, status: 'delaying', timestamp: Date.now() });
      this.runs.set(runId, run);
      this.saveData();

      setTimeout(() => {
        run.history.push({ stepId: step.id, status: 'completed', timestamp: Date.now() });
        this.runs.set(runId, run);
        this.saveData();
        
        this.executeWorkflowStep(runId, stepIndex + 1, contextData);
      }, delayMs);
      return;
    }

    this.scheduleJob({
      workflowId: wf.id,
      type: `execute_${step.type}`,
      payload: { ...interpolatedPayload, runId, stepIndex, contextData },
      priority: 'medium',
      maxRetries: wf.retrySettings.maxRetries
    });

    run.history.push({ stepId: step.id, status: 'queued', timestamp: Date.now() });
    this.runs.set(runId, run);
    this.saveData();
  }

  // ─── PUBLIC SCHEDULER API ───────────────────────────────────

  public scheduleJob(jobOpts: Omit<Job, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): Job {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const job: Job = {
      ...jobOpts,
      id,
      status: 'queued',
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    queueManager.enqueue(job);
    
    this.log('queue', `Job enqueued: ${job.type} (${id})`, { priority: job.priority });
    automationEventEmitter.emit(AutomationEvents.JOB_QUEUED, job);

    return job;
  }

  // ─── PUBLIC COMMUNICATIONS API ──────────────────────────────

  public async sendEmail(payload: EmailPayload): Promise<boolean> {
    const success = await emailService.sendEmail(payload);
    if (success) this.log('email', `Email sent to ${payload.to}`);
    return success;
  }

  public async sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
    const success = await whatsappService.sendWhatsApp(payload);
    if (success) this.log('whatsapp', `WhatsApp sent to ${payload.phone}`);
    return success;
  }

  public async sendSMS(payload: SMSPayload): Promise<boolean> {
    const success = await smsService.sendSMS(payload);
    if (success) this.log('sms', `SMS sent to ${payload.phone}`);
    return success;
  }

  public async sendNotification(payload: NotificationPayload): Promise<boolean[]> {
    const results = await notificationEngine.sendNotification(payload);
    this.log('notification', `Notification dispatched to user ${payload.userId}`);
    return results;
  }

  // ─── TRIGGER & WEBHOOK REGISTRATION ──────────────────────────

  public registerTrigger(trigger: Trigger): Trigger {
    this.log('trigger', `Trigger registered: ${trigger.type}`, trigger);
    return trigger;
  }

  public registerWebhook(name: string, url: string, secret?: string): Webhook {
    const wh = webhookManager.registerWebhook(name, url, secret);
    this.log('webhook', `Webhook registered: ${name}`, { id: wh.id, url });
    return wh;
  }

  // ─── PRIVATE INTERNALS ───────────────────────────────────────

  private async runJobPayload(job: Job): Promise<any> {
    const payload = job.payload;
    const runId = payload.runId;
    const stepIndex = payload.stepIndex;
    const contextData = payload.contextData;

    try {
      if (job.type === 'execute_email') {
        await this.sendEmail(payload as EmailPayload);
      } else if (job.type === 'execute_whatsapp') {
        await this.sendWhatsApp(payload as WhatsAppPayload);
      } else if (job.type === 'execute_sms') {
        await this.sendSMS(payload as SMSPayload);
      } else if (job.type === 'execute_notification') {
        await this.sendNotification(payload as NotificationPayload);
      } else if (job.type === 'execute_webhook') {
        const webhookId = payload.webhookId;
        await webhookManager.fireWebhook(webhookId, payload.data || {});
      }

      if (runId !== undefined && stepIndex !== undefined) {
        const run = this.runs.get(runId);
        if (run) {
          const wf = this.workflows.get(run.workflowId)!;
          const step = wf.steps[stepIndex];
          run.history.push({ stepId: step.id, status: 'completed', timestamp: Date.now() });
          this.runs.set(runId, run);
          this.saveData();
          
          this.executeWorkflowStep(runId, stepIndex + 1, contextData);
        }
      }
    } catch (e: any) {
      if (runId !== undefined && stepIndex !== undefined) {
        const run = this.runs.get(runId);
        if (run) {
          const wf = this.workflows.get(run.workflowId)!;
          const step = wf.steps[stepIndex];
          run.history.push({ stepId: step.id, status: 'failed', timestamp: Date.now(), error: e.message });
          run.status = 'failed';
          run.completedAt = Date.now();
          this.runs.set(runId, run);
          this.saveData();

          this.log('workflow', `Workflow "${wf.name}" run ${runId} failed at step ${step.id}.`, { error: e.message });
        }
      }
      throw e;
    }
  }

  public getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  public getRuns(workflowId?: string): WorkflowRun[] {
    const list = Array.from(this.runs.values());
    if (workflowId) return list.filter((r) => r.workflowId === workflowId);
    return list;
  }

  public getLogs() {
    return this.logs;
  }
}

export const automationManager = new AutomationManager();
serviceRegistry.register('automationManager', automationManager);
export default automationManager;
