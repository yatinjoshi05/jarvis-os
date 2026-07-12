import { ShellType } from './types';

/**
 * Terminal session attributes.
 */
export interface TerminalSession {
  id: string;
  shell: ShellType;
  cwd: string;
}

/**
 * Command run logging variables.
 */
export interface TerminalCommand {
  rawCommand: string;
  timestamp: number;
  output?: string;
  exitCode?: number;
}
