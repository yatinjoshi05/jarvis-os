import { EventEmitter } from 'events';
import { db } from '../database/db.js';

export class QueueSystem extends EventEmitter {
  constructor() {
    super();
    this.queues = {
      script_queue: [],
      scene_queue: [],
      voice_queue: [],
      render_queue: [],
      upload_queue: []
    };
    this.activeJobs = new Map();
    this.jobHistory = new Map();
    this.isProcessing = false;
  }

  /**
   * Enqueue job into specified queue
   */
  async addJob(queueName, data, options = {}) {
    if (!this.queues[queueName]) {
      throw new Error(`Queue ${queueName} does not exist`);
    }

    const jobId = `job_${queueName}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const job = {
      id: jobId,
      queueName,
      data,
      attempts: 0,
      maxRetries: options.retries || 3,
      status: 'queued', // queued, active, completed, failed
      progress: 0,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.queues[queueName].push(job);
    this.activeJobs.set(jobId, job);
    
    db.addLog('video', {
      story_id: data.storyId || data.id,
      action: 'ENQUEUED',
      details: `Job ${jobId} added to ${queueName}`,
      status: 'QUEUED'
    });

    this.emit('job:added', job);
    this.processNext(queueName);
    return job;
  }

  /**
   * Process pending queue jobs with automatic status & progress tracking
   */
  async processNext(queueName) {
    if (this.queues[queueName].length === 0) return;
    const job = this.queues[queueName].shift();

    job.status = 'active';
    job.updated_at = new Date().toISOString();
    this.emit('job:progress', { jobId: job.id, progress: 10, status: 'active' });

    try {
      // Simulate task progress percentage steps
      for (let p = 20; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 80));
        job.progress = p;
        job.updated_at = new Date().toISOString();
        this.emit('job:progress', { jobId: job.id, progress: p, status: 'active' });
      }

      job.status = 'completed';
      job.progress = 100;
      this.jobHistory.set(job.id, job);

      db.addLog('video', {
        story_id: job.data.storyId || job.data.id,
        action: 'JOB_COMPLETED',
        details: `Queue ${queueName} completed job ${job.id}`,
        status: 'SUCCESS'
      });

      this.emit('job:completed', job);
    } catch (err) {
      job.attempts += 1;
      if (job.attempts < job.maxRetries) {
        job.status = 'retrying';
        this.queues[queueName].unshift(job);
        db.addLog('video', {
          story_id: job.data.storyId || job.data.id,
          action: 'RETRYING',
          details: `Job ${job.id} failed, retry attempt ${job.attempts}/${job.maxRetries}`,
          status: 'RETRY'
        });
      } else {
        job.status = 'failed';
        job.error = err.message;
        this.jobHistory.set(job.id, job);
        db.addLog('video', {
          story_id: job.data.storyId || job.data.id,
          action: 'JOB_FAILED',
          details: `Job ${job.id} failed permanently: ${err.message}`,
          status: 'FAILED'
        });
        this.emit('job:failed', job);
      }
    }
  }

  /**
   * Get queue metrics and status tracking
   */
  getQueueStatus(queueName) {
    if (queueName && this.queues[queueName]) {
      return {
        queueName,
        waiting: this.queues[queueName].length,
        activeCount: Array.from(this.activeJobs.values()).filter(j => j.queueName === queueName && j.status === 'active').length,
        completedCount: Array.from(this.jobHistory.values()).filter(j => j.queueName === queueName && j.status === 'completed').length
      };
    }

    const summary = {};
    for (const qKey of Object.keys(this.queues)) {
      summary[qKey] = {
        waiting: this.queues[qKey].length,
        active: Array.from(this.activeJobs.values()).filter(j => j.queueName === qKey && j.status === 'active').length,
        completed: Array.from(this.jobHistory.values()).filter(j => j.queueName === qKey && j.status === 'completed').length
      };
    }
    return summary;
  }
}

export const queueManager = new QueueSystem();
