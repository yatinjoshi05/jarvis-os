import { EventEmitter } from 'events';

class EventHubBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  broadcast(event, payload) {
    this.emit(event, {
      event,
      payload,
      timestamp: new Date().toISOString()
    });
  }
}

export const eventHub = new EventHubBus();
