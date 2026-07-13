import { Job } from './interfaces';
import { queueManager } from './queue';
import { AUTOMATION_CONFIG } from './config';
import { automationEventEmitter, AutomationEvents } from './events';
import { TimeoutError } from './errors';
import { AutomationUtils } from './utils';

export class BackgroundWorker {
  private activeCount = 0;
  private isRunning = false;
  private intervalId?: any;
  private runner?: (job: Job) => Promise<any>;

  public setRunner(runner: (job: Job) => Promise<any>) {
    this.runner = runner;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async processQueue() {
    if (!this.isRunning) return;
    const settings = AUTOMATION_CONFIG.workerSettings;

    while (this.activeCount < settings.maxParallelWorkers) {
      const job = queueManager.dequeue();
      if (!job) break;

      this.activeCount++;
      this.runJob(job).finally(() => {
        this.activeCount--;
      });
    }
  }

  private async runJob(job: Job) {
    job.status = 'running';
    job.updatedAt = Date.now();
    const settings = AUTOMATION_CONFIG.workerSettings;

    try {
      if (!this.runner) {
        throw new Error('No job runner registered.');
      }

      await Promise.race([
        this.runner(job),
        new Promise((_, reject) =>
          setTimeout(() => reject(new TimeoutError(job.id, settings.defaultTimeoutMs)), settings.defaultTimeoutMs)
        )
      ]);

      job.status = 'completed';
      job.updatedAt = Date.now();
      automationEventEmitter.emit(AutomationEvents.JOB_COMPLETED, job);
    } catch (e: any) {
      job.errorLog = e.message || String(e);
      
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'queued';
        job.updatedAt = Date.now();
        
        const backoff = AutomationUtils.calculateBackoffDelay(job.retryCount, settings.defaultRetryDelayMs);
        job.executeAfter = Date.now() + backoff;

        queueManager.enqueue(job);
      } else {
        queueManager.moveToDeadLetter(job);
        automationEventEmitter.emit(AutomationEvents.WORKFLOW_FAILED, { jobId: job.id, error: job.errorLog });
      }
    }
  }
}

export const backgroundWorker = new BackgroundWorker();
export default backgroundWorker;
