import { useTerminalStore } from '../model/useTerminalStore';
import { TerminalOutputToken } from '../types';
import { getBackendApiUrl } from '../../../shared/ai/config';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

// ── SECURITY INFRASTRUCTURE HOOKS (PHASE 3.1: NO RESTRICTIONS) ──
export function validateCommand(_input: string): { valid: boolean; reason?: string } {
  // Hook for future phase command policy verification
  return { valid: true };
}

export function sanitizeInput(input: string): string {
  // Hook for future phase input sanitization
  return input;
}

export function PermissionGuard(_action: string): boolean {
  // Hook for future phase privilege escalation checks
  return true;
}

// Map raw CLI stream lines to syntax highlighted output tokens
export function parseStreamLineToTokens(line: string): TerminalOutputToken[] {
  if (!line) return [];

  // Match bracketed tags e.g. [JARVIS], [Version], [Memory], [Files]
  const tagRegex = /^(\[[A-Za-z0-9_-]+\])(.*)$/;
  const match = line.match(tagRegex);

  if (match) {
    const [, tag, rest] = match;
    return [
      { text: tag, color: 'cyan', bold: true },
      { text: rest, color: 'white' },
    ];
  }

  if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
    return [{ text: line, color: 'red' }];
  }

  if (line.toLowerCase().includes('warning')) {
    return [{ text: line, color: 'yellow' }];
  }

  return [{ text: line, color: 'white' }];
}

class TerminalService {
  private activeStreams: Map<string, { unlisten?: () => void }> = new Map();

  async initializeGitBashCheck() {
    const store = useTerminalStore.getState();
    if (isTauriRuntime()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const available = await invoke<boolean>('check_git_bash_available');
        store.setGitBashAvailable(available);
      } catch (e) {
        console.warn('[TerminalService] Git Bash check failed via Tauri:', e);
        store.setGitBashAvailable(true);
      }
    } else {
      try {
        const res = await fetch(getBackendApiUrl('/api/terminal/check-gitbash'));
        if (res.ok) {
          const data = await res.json();
          store.setGitBashAvailable(data.available);
        }
      } catch (e) {
        store.setGitBashAvailable(true);
      }
    }
  }

  async executeCommand(sessionId: string, rawCommand: string) {
    const store = useTerminalStore.getState();
    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Security hooks
    const sanitized = sanitizeInput(trimmed);
    const validation = validateCommand(sanitized);
    if (!validation.valid) {
      store.appendOutput(sessionId, `[Security] Command blocked: ${validation.reason}`, 'error');
      return;
    }

    if (!PermissionGuard('execute')) {
      store.appendOutput(sessionId, '[Security] Permission denied.', 'error');
      return;
    }

    // Append prompt line to screen
    store.appendOutput(sessionId, '', 'prompt', `${session.cwd}>`, sanitized);
    store.setSessionStatus(sessionId, 'executing');

    // Handle builtin clear screen command (`cls` / `clear`)
    if (sanitized.toLowerCase() === 'cls' || sanitized.toLowerCase() === 'clear') {
      store.clearSession(sessionId);
      store.setSessionStatus(sessionId, 'idle');
      return;
    }

    // Handle `cd <path>` navigation command
    if (sanitized.toLowerCase().startsWith('cd ') || sanitized.toLowerCase() === 'cd') {
      const parts = sanitized.split(/\s+/);
      if (parts.length > 1) {
        const target = parts.slice(1).join(' ').trim();
        if (target === '..') {
          const split = session.cwd.split('\\');
          if (split.length > 1) {
            split.pop();
            const newCwd = split.join('\\') || 'C:\\';
            store.setSessionCwd(sessionId, newCwd);
          }
        } else if (target.includes(':\\')) {
          store.setSessionCwd(sessionId, target);
        } else {
          store.setSessionCwd(sessionId, `${session.cwd}\\${target}`);
        }
      }
      store.setSessionStatus(sessionId, 'idle');
      return;
    }

    // Execute command via PTY / backend shell executor
    if (isTauriRuntime()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        // Check if session has active PTY, if not spawn one
        let ptyId = session.id;
        try {
          await invoke('write_to_pty', { sessionId: ptyId, input: `${sanitized}\r\n` });
        } catch (e) {
          // Spawn PTY on first write
          ptyId = await invoke<string>('spawn_pty', {
            shell: session.shell,
            cwd: session.cwd,
          });

          // Listen to stdout stream
          const unlisten = await listen<string>(`terminal:stream:${ptyId}`, (event: { payload: string }) => {
            const lines = event.payload.split('\n');
            lines.forEach((l: string) => {
              const clean = l.replace(/\r/g, '');
              if (clean.trim()) {
                const tokens = parseStreamLineToTokens(clean);
                store.appendOutput(sessionId, tokens);
              }
            });
          });

          this.activeStreams.set(sessionId, { unlisten });
          await invoke('write_to_pty', { sessionId: ptyId, input: `${sanitized}\r\n` });
        }

        store.setSessionStatus(sessionId, 'idle');
      } catch (e: any) {
        console.warn('[TerminalService] Tauri PTY execution failed, falling back to Web API:', e);
        await this.executeWebFallback(sessionId, session.shell, session.cwd, sanitized);
      }
    } else {
      await this.executeWebFallback(sessionId, session.shell, session.cwd, sanitized);
    }
  }

  private async executeWebFallback(
    sessionId: string,
    shell: string,
    cwd: string,
    command: string
  ) {
    const store = useTerminalStore.getState();
    try {
      const url = getBackendApiUrl('/api/terminal/exec');
      console.log("Resolved API:", url);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, shell, cwd }),
      });

      const contentType = res.headers.get('content-type') || '';
      const status = res.status;
      const rawText = await res.text();

      console.log('[TerminalService Validation]', {
        status,
        contentType,
        rawResponse: rawText,
      });

      if (!res.ok || contentType.includes('text/html') || !contentType.includes('application/json')) {
        const errorMsg = contentType.includes('text/html') ? 'Wrong server reached' : 'Execution error';
        store.appendOutput(sessionId, errorMsg, 'error');
        store.setSessionStatus(sessionId, 'error');
        return;
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (e: any) {
        store.appendOutput(sessionId, 'Failed to parse JSON response', 'error');
        store.setSessionStatus(sessionId, 'error');
        return;
      }

      if (data.output) {
        const lines = data.output.split('\n');
        lines.forEach((line: string) => {
          const clean = line.replace(/\r/g, '');
          if (clean.trim()) {
            const tokens = parseStreamLineToTokens(clean);
            store.appendOutput(sessionId, tokens);
          }
        });
        store.setSessionStatus(sessionId, 'idle');
      } else if (data.error) {
        store.appendOutput(sessionId, data.error, 'error');
        store.setSessionStatus(sessionId, 'error');
      } else {
        store.setSessionStatus(sessionId, 'idle');
      }
    } catch (e: any) {
      store.appendOutput(sessionId, `Execution error: ${e.message}`, 'error');
      store.setSessionStatus(sessionId, 'error');
    }
  }

  sendInterrupt(sessionId: string) {
    const store = useTerminalStore.getState();
    if (isTauriRuntime()) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('write_to_pty', { sessionId, input: '\x03' }).catch(() => {});
      });
    }
    store.appendOutput(sessionId, '^C', 'warning');
    store.setSessionStatus(sessionId, 'idle');
  }

  closeSession(sessionId: string) {
    const stream = this.activeStreams.get(sessionId);
    if (stream?.unlisten) {
      stream.unlisten();
      this.activeStreams.delete(sessionId);
    }

    if (isTauriRuntime()) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('close_pty', { sessionId }).catch(() => {});
      });
    }

    useTerminalStore.getState().closeSession(sessionId);
  }
}

export const terminalService = new TerminalService();
