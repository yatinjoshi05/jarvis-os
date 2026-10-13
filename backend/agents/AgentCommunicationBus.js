import { db } from '../database/db.js';
import { eventHub } from '../../services/backend/src/websocket/EventHub.js';

export class AgentCommunicationBus {
  static sharedMemory = new Map();

  static dispatchMessage({ from, to, message, payload = {} }) {
    const logEntry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      from,
      to,
      message,
      payload,
      timestamp: new Date().toISOString()
    };

    const existingLogs = db.getLogs('agent') || [];
    db.addLog({
      action: `AGENT_MESSAGE:${from}->${to}`,
      details: message,
      status: 'SENT'
    });

    eventHub.broadcast('agent:log', logEntry);
    return logEntry;
  }

  static writeSharedMemory(key, value) {
    this.sharedMemory.set(key, value);
  }

  static readSharedMemory(key) {
    return this.sharedMemory.get(key);
  }
}
