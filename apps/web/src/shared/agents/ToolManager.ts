import { Tool } from './interfaces';
import { ToolUnavailableError } from './errors';

class ToolManager {
  private tools = new Map<string, Tool>();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.registerTool({
      id: 'http_request',
      name: 'HTTP Client',
      description: 'Make network HTTP requests to external APIs',
      execute: async (args) => {
        const url = args.url as string;
        const method = (args.method as string) || 'GET';
        console.log(`[Tool:HTTP] Calling ${method} ${url}`);
        return { status: 200, data: `Mock response from ${url}` };
      }
    });

    this.registerTool({
      id: 'filesystem_read',
      name: 'Filesystem Reader',
      description: 'Read contents of local files',
      execute: async (args) => {
        const path = args.path as string;
        console.log(`[Tool:Filesystem] Reading ${path}`);
        return `Mock file content of ${path}`;
      }
    });
  }

  public registerTool(tool: Tool) {
    this.tools.set(tool.id, tool);
  }

  public unregisterTool(toolId: string) {
    this.tools.delete(toolId);
  }

  public getTool(toolId: string): Tool {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new ToolUnavailableError(toolId);
    }
    return tool;
  }

  public getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(toolId: string, args: Record<string, any>): Promise<any> {
    const tool = this.getTool(toolId);
    return tool.execute(args);
  }
}

export const toolManager = new ToolManager();
export default toolManager;
