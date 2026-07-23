export type AgentState =
  | 'Idle'
  | 'Initializing'
  | 'Ready'
  | 'Running'
  | 'Paused'
  | 'Waiting'
  | 'Completed'
  | 'Failed'
  | 'Error'
  | 'Stopped';

export type AgentRole =
  | 'advisor'
  | 'coder'
  | 'researcher'
  | 'browser_executor'
  | 'communicator'
  | 'system_operator'
  | 'agent_architect'
  | 'system_supervisor'
  | 'voice_communicator';

export type CommunicationMessage = {
  id: string;
  senderId: string;
  receiverId?: string; // If undefined, broadcast
  type: 'event' | 'request' | 'response' | 'error';
  topic: string;
  payload: any;
  timestamp: number;
};
