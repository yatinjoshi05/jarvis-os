import { Command } from './interfaces';
import { dashboardEventEmitter, DashboardEvents } from './events';

class CommandBarManager {
  private commands = new Map<string, Command>();
  private history: string[] = [];

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    this.registerCommand({
      id: 'help',
      text: '/help',
      description: 'Show available system commands',
      category: 'system',
      execute: () => {
        console.log('Available commands: ' + Array.from(this.commands.keys()).join(', '));
      }
    });

    this.registerCommand({
      id: 'clear',
      text: '/clear',
      description: 'Clear command line history console logs',
      category: 'system',
      execute: () => {
        this.history = [];
      }
    });
  }

  public registerCommand(command: Command) {
    this.commands.set(command.id, command);
  }

  public unregisterCommand(commandId: string) {
    this.commands.delete(commandId);
  }

  public getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  public async executeCommand(rawCommandText: string): Promise<void> {
    const trimmed = rawCommandText.trim();
    if (!trimmed) return;

    this.history.push(trimmed);
    const parts = trimmed.split(/\s+/);
    const commandText = parts[0].toLowerCase();
    const args = parts.slice(1);

    let matchedCommand: Command | null = null;
    for (const cmd of this.commands.values()) {
      if (cmd.text.toLowerCase() === commandText || cmd.id.toLowerCase() === commandText) {
        matchedCommand = cmd;
        break;
      }
    }

    if (matchedCommand) {
      await matchedCommand.execute(args);
      dashboardEventEmitter.emit(DashboardEvents.COMMAND_EXECUTED, { command: trimmed, success: true });
    } else {
      dashboardEventEmitter.emit(DashboardEvents.COMMAND_EXECUTED, { command: trimmed, success: false, error: 'Command not found' });
      throw new Error(`Command "${commandText}" not found.`);
    }
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public getSuggestions(query: string): Command[] {
    const lowerQuery = query.toLowerCase();
    return this.getCommands().filter(
      (cmd) => cmd.text.toLowerCase().includes(lowerQuery) || cmd.description.toLowerCase().includes(lowerQuery)
    );
  }
}

export const commandBarManager = new CommandBarManager();
export default commandBarManager;
