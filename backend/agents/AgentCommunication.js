export class AgentCommunication {
  static messageBus = [];

  /**
   * Send inter-agent message
   */
  static sendMessage({ from, to, message, payload = {} }) {
    const msgObj = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      from,
      to,
      message,
      payload,
      timestamp: new Date().toISOString()
    };

    this.messageBus.unshift(msgObj);
    if (this.messageBus.length > 200) this.messageBus = this.messageBus.slice(0, 200);

    return msgObj;
  }

  /**
   * Get message history
   */
  static getMessageHistory(agentName = null) {
    if (!agentName) return this.messageBus;
    return this.messageBus.filter(m => m.from === agentName || m.to === agentName);
  }
}
