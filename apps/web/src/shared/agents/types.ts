export type AgentState =
  | 'Idle'
  | 'Initializing'
  | 'Ready'
  | 'Running'
  | 'Paused'
  | 'Waiting'
  | 'Completed'
  | 'Failed'
  | 'Stopped';

export type AgentRole =
  | 'advisor'
  | 'coder'
  | 'researcher'
  | 'browser_executor'
  | 'communicator'
  | 'system_operator';

export type CommunicationMessage = {
  id: string;
  senderId: string;
  receiverId?: string; // If undefined, broadcast
  type: 'event' | 'request' | 'response' | 'error';
  topic: string;
  payload: any;
  timestamp: number;
};
