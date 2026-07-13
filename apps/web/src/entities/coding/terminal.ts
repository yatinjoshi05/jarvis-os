import { TerminalCommand } from './interfaces';
import { CODING_CONFIG } from './config';
import { TerminalFailureError, PermissionDeniedError } from './errors';

export class TerminalAgent {
  private history: TerminalCommand[] = [];

  public async runCommand(command: string, cwd = CODING_CONFIG.defaultWorkspaceRoot): Promise<TerminalCommand> {
    const isWhitelisted = CODING_CONFIG.allowedTerminalCommands.some((c) => command.startsWith(c));
    
    if (!isWhitelisted) {
      throw new PermissionDeniedError(`Command execution of "${command}" is blocked by sandbox security policy.`);
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const record: TerminalCommand = {
      id: commandId,
      command,
      cwd,
      status: 'running',
      stdout: '',
      stderr: '',
      durationMs: 0,
      timestamp: Date.now(),
      isMock: true
    };

    this.history.push(record);
    const startTime = Date.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let stdout = '';
      const stderr = '';
      const exitCode = 0;

      if (command.includes('npm test')) {
        stdout = 'PASS  src/entities/financial/calculators.test.ts\n✓ SIP growth calculations (12ms)\n✓ EMI amortization checks (5ms)';
      } else if (command.includes('git status')) {
        stdout = 'On branch main\nYour branch is up to date with origin/main.\n\nnothing to commit, working tree clean';
      } else if (command.includes('tsc --noEmit')) {
        stdout = 'TypeScript compilation completed successfully.';
      } else if (command.includes('pnpm build:web')) {
        stdout = 'vite build completed successfully.';
      } else {
        stdout = `Command "${command}" completed successfully.`;
      }

      record.status = 'success';
      record.stdout = stdout;
      record.stderr = stderr;
      record.exitCode = exitCode;
      record.durationMs = Date.now() - startTime;

      return record;
    } catch (e: any) {
      record.status = 'failed';
      record.stderr = e.message || String(e);
      record.exitCode = 1;
      record.durationMs = Date.now() - startTime;
      
      throw new TerminalFailureError(command, 1, record.stderr);
    }
  }

  public getHistory(): TerminalCommand[] {
    return this.history;
  }
}

export const terminalAgent = new TerminalAgent();
export default terminalAgent;
