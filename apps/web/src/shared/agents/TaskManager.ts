import { Task, ExecutionContext, AgentResult } from './interfaces';
import { agentRouter } from './AgentRouter';
import { agentEventEmitter, AgentEvents } from './events';
import { AGENT_CONFIG } from './config';

class TaskManager {
  private queue: Task[] = [];

  public createTask(name: string, description: string, priority: Task['priority'] = 'medium'): Task {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      description,
      priority,
      status: 'pending',
      dependencies: [],
      retryCount: 0
    };

    this.queue.push(task);
    agentEventEmitter.emit(AgentEvents.TASK_CREATED, task);
    return task;
  }

  public async executeTask(taskId: string, context: ExecutionContext): Promise<AgentResult> {
    const task = this.queue.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`[TaskManager] Task with ID "${taskId}" not found in queue.`);
    }

    task.status = 'running';

    try {
      const agent = agentRouter.route(task);
      task.assignedAgentId = agent.id;
      
      const result = await agent.execute(task, context);
      
      if (result.success) {
        task.status = 'completed';
        task.result = result.data;
        agentEventEmitter.emit(AgentEvents.TASK_COMPLETED, task);
      } else {
        throw new Error(result.error || 'Execution failed');
      }

      return result;
    } catch (e: any) {
      task.retryCount++;
      if (task.retryCount <= AGENT_CONFIG.maxRetries) {
        console.warn(`[TaskManager] Retrying task "${task.id}" (${task.retryCount}/${AGENT_CONFIG.maxRetries})...`);
        return this.executeTask(taskId, context);
      }

      task.status = 'failed';
      task.error = e.message;
      agentEventEmitter.emit(AgentEvents.TASK_FAILED, { taskId, error: e.message });

      return {
        agentId: task.assignedAgentId || 'unknown',
        success: false,
        error: e.message
      };
    }
  }

  public cancelTask(taskId: string) {
    const task = this.queue.find((t) => t.id === taskId);
    if (task) {
      task.status = 'cancelled';
    }
  }

  public getTasks(): Task[] {
    return [...this.queue];
  }
}

export const taskManager = new TaskManager();
export default taskManager;
