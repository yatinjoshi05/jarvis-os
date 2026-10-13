export class TaskRouter {
  static taskQueue = [];
  static activeTasks = new Map();

  /**
   * Route task to designated target agent
   */
  static async routeTask({ targetAgent, taskName, payload, priority = 1 }) {
    const taskId = `task_${targetAgent}_${Date.now()}`;
    const taskObj = {
      id: taskId,
      targetAgent,
      taskName,
      payload,
      priority,
      status: 'queued',
      progress: 0,
      retries: 0,
      maxRetries: 3,
      created_at: new Date().toISOString()
    };

    this.taskQueue.push(taskObj);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    this.activeTasks.set(taskId, taskObj);

    return taskObj;
  }

  /**
   * Update task progress & status
   */
  static updateTaskProgress(taskId, progress, status = 'processing') {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      task.status = status;
    }
  }
}
