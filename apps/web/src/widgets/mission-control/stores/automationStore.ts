import { create } from 'zustand';
import { automationEngine, WorkflowItem, AutomationTrigger, WorkflowActionStep } from '../services/AutomationEngine';

interface AutomationState {
  workflows: WorkflowItem[];
  runWorkflow: (id: string) => void;
  pauseWorkflow: (id: string) => void;
  createWorkflow: (name: string, trigger: AutomationTrigger, steps: WorkflowActionStep[]) => void;
  refreshWorkflows: () => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  workflows: automationEngine.getWorkflows(),

  runWorkflow: (id) => {
    automationEngine.runWorkflow(id);
    set({ workflows: [...automationEngine.getWorkflows()] });
  },

  pauseWorkflow: (id) => {
    automationEngine.pauseWorkflow(id);
    set({ workflows: [...automationEngine.getWorkflows()] });
  },

  createWorkflow: (name, trigger, steps) => {
    automationEngine.createWorkflow(name, trigger, steps);
    set({ workflows: [...automationEngine.getWorkflows()] });
  },

  refreshWorkflows: () => {
    set({ workflows: [...automationEngine.getWorkflows()] });
  },
}));
