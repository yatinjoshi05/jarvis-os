import { create } from 'zustand';
import { agentCoordinator, AgentDetails } from '../services/AgentCoordinator';

interface AgentState {
  agents: AgentDetails[];
  startAgent: (id: string) => void;
  stopAgent: (id: string) => void;
  restartAgent: (id: string) => void;
  assignTask: (id: string, task: string) => void;
  refreshAgents: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: agentCoordinator.getAgents(),

  startAgent: (id) => {
    agentCoordinator.startAgent(id);
    set({ agents: agentCoordinator.getAgents() });
  },

  stopAgent: (id) => {
    agentCoordinator.stopAgent(id);
    set({ agents: agentCoordinator.getAgents() });
  },

  restartAgent: (id) => {
    agentCoordinator.restartAgent(id);
    set({ agents: agentCoordinator.getAgents() });
  },

  assignTask: (id, task) => {
    agentCoordinator.assignTask(id, task);
    set({ agents: agentCoordinator.getAgents() });
  },

  refreshAgents: () => {
    set({ agents: agentCoordinator.getAgents() });
  },
}));
