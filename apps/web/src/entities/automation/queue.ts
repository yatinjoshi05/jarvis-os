import { Job } from './interfaces';
import { AUTOMATION_CONFIG } from './config';
import { QueueOverflowError } from './errors';
import { AutomationUtils } from './utils';

export class QueueManager {
  private queue: Job[] = [];
  private deadLetterQueue: Job[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const storedQueue = localStorage.getItem('jarvis_auto_queue');
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue) as Job[];
      }
      const storedDlq = localStorage.getItem('jarvis_auto_dlq');
      if (storedDlq) {
        this.deadLetterQueue = JSON.parse(storedDlq) as Job[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_auto_queue', JSON.stringify(this.queue));
      localStorage.setItem('jarvis_auto_dlq', JSON.stringify(this.deadLetterQueue));
    } catch (_) { /* ignore */ }
  }

  public enqueue(job: Job) {
    const limits = AUTOMATION_CONFIG.queueLimits;
    if (this.queue.length >= limits.maxQueueSize) {
      throw new QueueOverflowError('main', limits.maxQueueSize);
    }

    this.queue.push(job);
    this.queue.sort(AutomationUtils.prioritize);
    this.saveData();
  }

  public dequeue(): Job | undefined {
    const now = Date.now();
    const index = this.queue.findIndex((j) => !j.executeAfter || j.executeAfter <= now);
    if (index === -1) return undefined;

    const [job] = this.queue.splice(index, 1);
    this.saveData();
    return job;
  }

  public cancelJob(jobId: string): boolean {
    const initialLen = this.queue.length;
    this.queue = this.queue.filter((j) => j.id !== jobId);
    this.saveData();
    return this.queue.length < initialLen;
  }

  public getJobs(): Job[] {
    return this.queue;
  }

  public getDeadLetterJobs(): Job[] {
    return this.deadLetterQueue;
  }

  public moveToDeadLetter(job: Job) {
    const limits = AUTOMATION_CONFIG.queueLimits;
    if (this.deadLetterQueue.length >= limits.maxDeadLetterQueueSize) {
      this.deadLetterQueue.shift();
    }
    job.status = 'failed';
    job.updatedAt = Date.now();
    this.deadLetterQueue.push(job);
    this.saveData();
  }

  public clearQueues() {
    this.queue = [];
    this.deadLetterQueue = [];
    this.saveData();
  }
}

export const queueManager = new QueueManager();
export default queueManager;
