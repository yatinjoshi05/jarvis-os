export class ContextManager {
  private memoryContext = '';
  private pluginContext: Record<string, string> = {};
  private agentContext = '';

  public setMemoryContext(memory: string) {
    this.memoryContext = memory;
  }

  public setPluginContext(pluginId: string, context: string) {
    this.pluginContext[pluginId] = context;
  }

  public setAgentContext(agent: string) {
    this.agentContext = agent;
  }

  public getContextString(): string {
    let contextStr = '';
    if (this.memoryContext) {
      contextStr += `Memory Context:\n${this.memoryContext}\n\n`;
    }
    const pluginEntries = Object.entries(this.pluginContext);
    if (pluginEntries.length > 0) {
      contextStr += `Plugin Contexts:\n`;
      for (const [pluginId, ctx] of pluginEntries) {
        contextStr += `- [${pluginId}]: ${ctx}\n`;
      }
      contextStr += `\n`;
    }
    if (this.agentContext) {
      contextStr += `Agent Context:\n${this.agentContext}\n\n`;
    }
    return contextStr.trim();
  }

  public clear() {
    this.memoryContext = '';
    this.pluginContext = {};
    this.agentContext = '';
  }
}

export const contextManager = new ContextManager();
