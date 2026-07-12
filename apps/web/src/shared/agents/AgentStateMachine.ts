import { AgentState } from './types';

export class AgentStateMachine {
  private currentState: AgentState = 'Idle';
  private allowedTransitions = new Map<AgentState, AgentState[]>();

  constructor() {
    this.initTransitions();
  }

  private initTransitions() {
    this.allowedTransitions.set('Idle', ['Initializing']);
    this.allowedTransitions.set('Initializing', ['Ready', 'Failed']);
    this.allowedTransitions.set('Ready', ['Running', 'Stopped']);
    this.allowedTransitions.set('Running', ['Paused', 'Waiting', 'Completed', 'Failed', 'Stopped']);
    this.allowedTransitions.set('Paused', ['Running', 'Stopped']);
    this.allowedTransitions.set('Waiting', ['Running', 'Failed', 'Stopped']);
    this.allowedTransitions.set('Completed', ['Idle', 'Running']);
    this.allowedTransitions.set('Failed', ['Idle', 'Running']);
    this.allowedTransitions.set('Stopped', ['Idle']);
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public transitionTo(nextState: AgentState): boolean {
    const list = this.allowedTransitions.get(this.currentState) || [];
    if (list.includes(nextState)) {
      this.currentState = nextState;
      return true;
    }
    return false;
  }
}
export default AgentStateMachine;
