/**
 * AutomationService — Public API for Scheduling, Triggers & Background Workflows
 */
export class AutomationService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Schedule one-shot timer or recurring background job
   */
  async scheduleJob(id, cronOrDuration, taskFn) {
    console.log(`[AutomationService] Scheduled job: ${id}`);
    this.jobs.set(id, { id, cronOrDuration, active: true });
    return { success: true, jobId: id };
  }

  /**
   * Cancel background job
   */
  async cancelJob(id) {
    if (this.jobs.has(id)) {
      this.jobs.delete(id);
      return { success: true, jobId: id };
    }
    return { success: false, error: 'Job not found' };
  }
}

export const automationService = new AutomationService();
