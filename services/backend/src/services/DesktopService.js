import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * DesktopService — Public API for Desktop Automation & Application Launching
 */
export class DesktopService {
  /**
   * Launch application on host operating system
   */
  static async openApplication(appName) {
    const targetApp = (appName || '').trim();
    if (!targetApp) throw new Error('Application name required.');

    try {
      const isWin = process.platform === 'win32';
      let cmd = isWin ? `start "" "${targetApp}"` : process.platform === 'darwin' ? `open -a "${targetApp}"` : `xdg-open "${targetApp}" &`;

      console.log(`[DesktopService] Launching app: ${targetApp}`);
      const { stdout, stderr } = await execAsync(cmd);
      return { success: true, appName: targetApp, stdout: stdout || '', stderr: stderr || '' };
    } catch (err) {
      console.error(`[DesktopService] Failed to open app ${targetApp}:`, err.message);
      throw new Error(`DesktopService Error: ${err.message}`);
    }
  }

  /**
   * Execute safe host command
   */
  static async executeCommand(command, cwd) {
    if (!command || !command.trim()) throw new Error('Command required.');
    try {
      console.log(`[DesktopService] Executing shell command: "${command}"`);
      const { stdout, stderr } = await execAsync(command, { cwd: cwd || process.cwd(), timeout: 30000 });
      return { success: true, command, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
      console.error(`[DesktopService] Command execution failed:`, err.message);
      throw new Error(`DesktopService Error: ${err.message}`);
    }
  }
}
