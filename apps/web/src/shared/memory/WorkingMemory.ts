import { MemoryRecord } from './interfaces';
import { memoryRouter } from './MemoryRouter';

class WorkingMemory {
  private activeObjective = '';
  private activeWorkflow = '';
  private currentTasks: string[] = [];

  public getObjective(): string {
    return this.activeObjective;
  }

  public setObjective(objective: string) {
    this.activeObjective = objective;
    this.saveToProvider('active_objective', objective);
  }

  public getWorkflow(): string {
    return this.activeWorkflow;
  }

  public setWorkflow(workflow: string) {
    this.activeWorkflow = workflow;
    this.saveToProvider('active_workflow', workflow);
  }

  public getTasks(): string[] {
    return this.currentTasks;
  }

  public setTasks(tasks: string[]) {
    this.currentTasks = tasks;
    this.saveToProvider('current_tasks', tasks);
  }

  public clear() {
    this.activeObjective = '';
    this.activeWorkflow = '';
    this.currentTasks = [];
    
    const provider = memoryRouter.getProvider('working');
    provider.clear('working');
  }

  private async saveToProvider(key: string, value: any) {
    try {
      const provider = memoryRouter.getProvider('working');
      const record: MemoryRecord = {
        id: `working_${key}`,
        key,
        scope: 'working',
        category: 'reasoning',
        value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await provider.save(record);
    } catch (_) { /* ignore */ }
  }
}

export const workingMemory = new WorkingMemory();
export default workingMemory;
