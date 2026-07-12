import { Workflow, Task, ExecutionContext } from './interfaces';
import { taskManager } from './TaskManager';
import { agentEventEmitter, AgentEvents } from './events';

class WorkflowManager {
  private workflows = new Map<string, Workflow>();

  public createWorkflow(name: string, description: string): Workflow {
    const id = `workflow_${Date.now()}`;
    const workflow: Workflow = {
      id,
      name,
      description,
      tasks: [],
      status: 'idle'
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  public addTaskToWorkflow(workflowId: string, name: string, description: string, priority: Task['priority'] = 'medium'): Task {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`[WorkflowManager] Workflow "${workflowId}" not found.`);
    }

    const task = taskManager.createTask(name, description, priority);
    workflow.tasks.push(task);
    return task;
  }

  public async executeWorkflow(workflowId: string, context: ExecutionContext, parallel = false): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`[WorkflowManager] Workflow "${workflowId}" not found.`);
    }

    workflow.status = 'running';
    agentEventEmitter.emit(AgentEvents.WORKFLOW_STARTED, workflow);

    try {
      if (parallel) {
        // Parallel execution
        const promises = workflow.tasks.map((task) => taskManager.executeTask(task.id, context));
        await Promise.all(promises);
      } else {
        // Sequential execution
        for (const task of workflow.tasks) {
          workflow.currentTaskId = task.id;
          const result = await taskManager.executeTask(task.id, context);
          if (!result.success) {
            throw new Error(`Task "${task.id}" failed: ${result.error}`);
          }
        }
      }

      workflow.status = 'completed';
      agentEventEmitter.emit(AgentEvents.WORKFLOW_FINISHED, { workflowId, success: true });
    } catch (e: any) {
      workflow.status = 'failed';
      agentEventEmitter.emit(AgentEvents.WORKFLOW_FINISHED, { workflowId, success: false, error: e.message });
      throw e;
    }
  }

  public getWorkflow(id: string): Workflow | null {
    return this.workflows.get(id) || null;
  }
}

export const workflowManager = new WorkflowManager();
export default workflowManager;
