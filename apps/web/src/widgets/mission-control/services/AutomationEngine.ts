import { agentEventBus } from './AgentEventBus';

export type AutomationTrigger =
  | 'Time trigger'
  | 'Voice trigger'
  | 'File trigger'
  | 'Mission trigger'
  | 'Manual trigger';

export type AutomationActionType =
  | 'Open application'
  | 'Open browser'
  | 'Open terminal'
  | 'Read file'
  | 'Write file'
  | 'Take screenshot'
  | 'Send email'
  | 'Create folder'
  | 'Run script'
  | 'Execute command';

export type WorkflowStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed';

export interface WorkflowActionStep {
  id: string;
  type: AutomationActionType;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowItem {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  status: WorkflowStatus;
  steps: WorkflowActionStep[];
  lastRunTime?: string;
}

export class AutomationEngineService {
  private workflows: WorkflowItem[] = [
    {
      id: 'wf-coding-mode',
      name: 'Coding Mode Automated Setup',
      trigger: 'Voice trigger',
      status: 'completed',
      lastRunTime: '13:45:00',
      steps: [
        { id: 's-1', type: 'Open terminal', target: 'powershell.exe', status: 'completed' },
        { id: 's-2', type: 'Open browser', target: 'http://localhost:5173', status: 'completed' },
        { id: 's-3', type: 'Create folder', target: 'd:/jarvis/projects/app', status: 'completed' },
        { id: 's-4', type: 'Open application', target: 'VS Code Workspace', status: 'completed' },
      ],
    },
    {
      id: 'wf-[#2]-health-check',
      name: 'System Health Telemetry Diagnostic',
      trigger: 'Time trigger',
      status: 'queued',
      lastRunTime: '12:00:00',
      steps: [
        { id: 's-5', type: 'Execute command', target: 'gcloud auth list', status: 'pending' },
        { id: 's-6', type: 'Take screenshot', target: 'Mission Control Dashboard', status: 'pending' },
      ],
    },
    {
      id: 'wf-3-web-scraping',
      name: 'Web Scraping & Intelligence Pipeline',
      trigger: 'Manual trigger',
      status: 'paused',
      lastRunTime: '10:30:00',
      steps: [
        { id: 's-7', type: 'Open browser', target: 'https://news.ycombinator.com', status: 'completed' },
        { id: 's-8', type: 'Run script', target: 'extract_headlines.py', status: 'pending' },
      ],
    },
  ];

  public getWorkflows(): WorkflowItem[] {
    return this.workflows;
  }

  public runWorkflow(id: string) {
    const wf = this.workflows.find((w) => w.id === id);
    if (!wf) return;

    wf.status = 'running';
    wf.lastRunTime = new Date().toLocaleTimeString();
    agentEventBus.emit('automation:triggered', { workflowId: id, name: wf.name });

    // Execute steps sequentially
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < wf.steps.length) {
        wf.steps[stepIndex].status = 'completed';
        agentEventBus.emit('workflow:step_completed', {
          workflowId: id,
          step: wf.steps[stepIndex],
        });
        stepIndex++;
      } else {
        wf.status = 'completed';
        clearInterval(interval);
      }
    }, 600);
  }

  public pauseWorkflow(id: string) {
    const wf = this.workflows.find((w) => w.id === id);
    if (wf) {
      wf.status = 'paused';
    }
  }

  public createWorkflow(name: string, trigger: AutomationTrigger, steps: WorkflowActionStep[]): WorkflowItem {
    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      name,
      trigger,
      status: 'queued',
      steps,
    };
    this.workflows.unshift(newWf);
    return newWf;
  }
}

export const automationEngine = new AutomationEngineService();
