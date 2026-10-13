import { TaskPlanner } from './TaskPlanner.js';
import { AgentCommunication } from './AgentCommunication.js';

export class ProducerAgent {
  static agentName = 'ProducerAgent';

  static planProduction(command, channelName = 'Old Couple Stories') {
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'DirectorAI',
      message: `Production planned for command: "${command}" on channel ${channelName}`
    });
    return TaskPlanner.createTimeline(command, channelName);
  }

  static assignTasks(dagSteps) {
    return dagSteps.map(step => ({ ...step, assigned: true, status: 'ready' }));
  }

  static calculateBudget(tasksCount = 1) {
    return { estimatedCostUsd: (tasksCount * 0.08).toFixed(2), computeUnits: tasksCount * 12 };
  }

  static createTimeline(command, channelName) {
    return TaskPlanner.createTimeline(command, channelName);
  }
}
