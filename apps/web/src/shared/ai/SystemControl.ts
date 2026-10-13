import { ErrorManager } from './ErrorManager';
import { SystemContextService } from '../system/SystemContextService';
import { autonomySafetyManager } from '../agents/safety/AutonomySafetyManager';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { getBackendApiUrl } from './config';

type SystemControlResult =
  | { handled: false }
  | { handled: true; message?: string; error?: Error };

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function normalizeQuotedValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '').trim();
}

function normalizeVolumeIntent(value: string): string {
  return value
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+(?:please|now)$/i, '')
    .trim();
}

export function isCompoundOrAnalyticalRequest(input: string): boolean {
  const p = input.toLowerCase().trim();

  const compoundVerbRegex = /\b(and|then|also|to)\s+(?:please\s+)?(analyze|analysis|summarize|summary|evaluate|compare|explain|synthesize|recommend|calculate|predict|investigate|interpret|review|assess|audit|report|tell|check|advise|determine|see|find out|give|provide)\b/i;
  if (compoundVerbRegex.test(p)) {
    return true;
  }

  const analyticalPhrasesRegex = /\b(should i|would it|is it|how to|why does|what is|what are|can you|could you|give me|tell me if|check if|advise on|pros and cons|best way|strategy|forecast|recommendation|opinion|rates and)\b/i;
  if (analyticalPhrasesRegex.test(p)) {
    return true;
  }

  if (/[;,]\s*(?:then|and|also|please|can you|could you|analyze|summarize|compare|explain|tell|give|check)/i.test(p)) {
    return true;
  }

  return false;
}

async function invokeSystemCommand<T>(command: string, args: Record<string, unknown>): Promise<T> {
  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(command, args);
    } catch (e) {
      console.warn('[SystemControl] Tauri invoke failed, using backend system executor fallback:', e);
    }
  }

  // Web / Dev Fallback: Call real backend system executor proxy
  if (command === 'open_application') {
    const url = getBackendApiUrl('/api/system/open-app');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: args.name })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || `Failed to open ${args.name}`);
    return json.message as T;
  }

  if (command === 'write_file') {
    const url = getBackendApiUrl('/api/system/write-file');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: args.path || args.filename, content: args.content })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || `Failed to write file`);
    return json.message as T;
  }

  if (command === 'browser_preview' || command === 'search_web') {
    const url = getBackendApiUrl('/api/system/browser-preview');
    const targetUrl = args.url || (args.query ? `https://www.google.com/search?q=${encodeURIComponent(String(args.query))}` : null);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, path: args.path })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || `Failed browser preview`);
    return json.message as T;
  }

  if (command === 'execute_command') {
    const url = getBackendApiUrl('/api/system/execute-command');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: args.command, cwd: args.cwd })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || `Failed executing command`);
    return json as T;
  }

  return `[System Control] Command ${command} executed.` as T;
}

class SystemControl {
  private pendingOrganizePlan: any[] | null = null;
  private pendingRenamePlan: any[] | null = null;

  async tryExecute(prompt: string): Promise<SystemControlResult> {
    const input = prompt.trim();
    if (!input) return { handled: false };

    // ── STAGE 4 SAFETY & AUTONOMY VOICE COMMANDS ──────────────────────────────

    // 1. Kill Switch: Pause Self-Modification
    if (/\b(?:pause|stop|halt)\s+(?:self-modification|self\s+modification|autonomy)\b/i.test(input)) {
      autonomySafetyManager.pauseSelfModification('User voice command trigger');
      return {
        handled: true,
        message: '🛑 **Kill Switch Activated**: Autonomous self-modification and creation have been **PAUSED**. To resume, say *"Jarvis, resume self-modification"*.'
      };
    }

    // 2. Kill Switch: Resume Self-Modification
    if (/\b(?:resume|unpause|start)\s+(?:self-modification|self\s+modification|autonomy)\b/i.test(input)) {
      autonomySafetyManager.resumeSelfModification();
      return {
        handled: true,
        message: '▶️ **Kill Switch Deactivated**: Autonomous self-modification and agent creation are now **ACTIVE**.'
      };
    }

    // 3. Confirm Pending Call Action
    if (/\bconfirm\s+(?:call|phone\s+call)\b/i.test(input)) {
      const pendingCall = autonomySafetyManager.getPendingConfirmation('call');
      if (!pendingCall) {
        return { handled: true, message: 'ℹ️ No pending phone call confirmation found.' };
      }
      autonomySafetyManager.confirmPendingAction(pendingCall.confirmationId);
      const res = await agentOrchestrator.orchestrate(`call ${pendingCall.recipient} and tell them ${pendingCall.content}`);
      return { handled: true, message: res.text };
    }

    // 4. Confirm Pending WhatsApp Action
    if (/\bconfirm\s+whatsapp\b/i.test(input)) {
      const pendingWa = autonomySafetyManager.getPendingConfirmation('whatsapp');
      if (!pendingWa) {
        return { handled: true, message: 'ℹ️ No pending WhatsApp confirmation found.' };
      }
      autonomySafetyManager.confirmPendingAction(pendingWa.confirmationId);
      const res = await agentOrchestrator.orchestrate(`send whatsapp to ${pendingWa.recipient} saying ${pendingWa.content}`);
      return { handled: true, message: res.text };
    }

    // 5. Autonomy & Audit Trail Status
    if (/\b(?:autonomy\s+status|audit\s+trail|safety\s+status)\b/i.test(input)) {
      const isPaused = autonomySafetyManager.isKillSwitchActive();
      const logs = autonomySafetyManager.getAuditLog(5);
      const logLines = logs.map((l) => `- \`[${l.formattedTime.slice(11, 19)}]\` **[${l.actionType}]** ${l.summary}`);
      return {
        handled: true,
        message: `### 🛡️ Autonomy & Safety System Status
- **Kill Switch Status**: ${isPaused ? '🛑 **PAUSED**' : '✅ **ACTIVE**'}
- **Recent Audit Trail Entries**:
${logLines.length > 0 ? logLines.join('\n') : '*No audit entries recorded yet.*'}`
      };
    }

    // ── STAGE 1-3 SYSTEM CONTROL COMMANDS ────────────────────────────────────

    if (this.pendingOrganizePlan) {
      const isConfirm = /^(?:yes|confirm|ok|go\s*ahead|y|proceed)$/i.test(input);
      const isCancel = /^(?:no|cancel|abort|n|stop)$/i.test(input);
      if (isConfirm) {
        const message = await invokeSystemCommand<string>('execute_organize_folder', { proposals: this.pendingOrganizePlan });
        this.pendingOrganizePlan = null;
        return { handled: true, message };
      }
      if (isCancel) {
        this.pendingOrganizePlan = null;
        return { handled: true, message: 'Folder organization cancelled.' };
      }
    }

    if (this.pendingRenamePlan) {
      const isConfirm = /^(?:yes|confirm|ok|go\s*ahead|y|proceed)$/i.test(input);
      const isCancel = /^(?:no|cancel|abort|n|stop)$/i.test(input);
      if (isConfirm) {
        const message = await invokeSystemCommand<string>('execute_rename_files', { proposals: this.pendingRenamePlan });
        this.pendingRenamePlan = null;
        return { handled: true, message };
      }
      if (isCancel) {
        this.pendingRenamePlan = null;
        return { handled: true, message: 'File renaming cancelled.' };
      }
    }

    try {
      const isTimeQuery = /^(?:what(?:'s|\s+is)\s+(?:the\s+)?time|current\s+time|time\s+now)$/i.test(input);
      if (isTimeQuery) {
        const { time } = SystemContextService.getCurrentTimeAndDate();
        return { handled: true, message: `The current time is **${time}**.` };
      }

      const isDateQuery = /^(?:what(?:'s|\s+is)\s+(?:the\s+)?date|current\s+date|today(?:'s)?\s+date)$/i.test(input);
      if (isDateQuery) {
        const { date } = SystemContextService.getCurrentTimeAndDate();
        return { handled: true, message: `Today is **${date}**.` };
      }

      const weatherMatch = input.match(/^(?:what(?:'s|\s+is)\s+(?:the\s+)?weather(?:\s+in|\s+for)?\s*(.*)|weather\s+(.*))$/i);
      if (weatherMatch) {
        const location = (weatherMatch[1] || weatherMatch[2] || '').trim();
        const weatherStr = await SystemContextService.fetchLiveWeather(location);
        return { handled: true, message: weatherStr };
      }

      const volumeInput = normalizeVolumeIntent(input);
      const setVolumeMatch = volumeInput.match(/^(?:set\s+)?(?:the\s+)?volume\s+(?:to\s+)?(\d{1,3})%?$/i);
      if (setVolumeMatch) {
        const message = await invokeSystemCommand<string>('set_system_volume', { level: Number(setVolumeMatch[1]) });
        return { handled: true, message };
      }
      if (/^(?:increase|turn up|raise)(?:\s+the)?\s+volume$/i.test(volumeInput)) {
        const message = await invokeSystemCommand<string>('adjust_volume', { delta: 10 });
        return { handled: true, message };
      }
      if (/^(?:decrease|turn down|lower)(?:\s+the)?\s+volume$/i.test(volumeInput)) {
        const message = await invokeSystemCommand<string>('adjust_volume', { delta: -10 });
        return { handled: true, message };
      }

      if (!isCompoundOrAnalyticalRequest(input)) {
        const searchEngineMap: Record<string, string> = {
          youtube: 'youtube',
          yt: 'youtube',
          google: 'google',
          web: 'google',
          'the web': 'google',
          duckduckgo: 'duckduckgo',
          ddg: 'duckduckgo',
        };

        const explicitSearchMatch =
          input.match(/^(?:search|find|look\s+up)\s+(?:(?:on|in|using|via|the)\s+)?(youtube|google|duckduckgo|ddg|web|the\s+web)?\s*(?:for\s+)?(.+?)(?:\s+(?:on|in|using|via)\s+(youtube|google|duckduckgo|ddg|web|the\s+web))?$/i)
          ?? input.match(/^(youtube|google|duckduckgo|ddg)\s+(.+)$/i);

        if (explicitSearchMatch) {
          const rawEnginePrefix = (explicitSearchMatch[1] || '').trim().toLowerCase();
          const rawEngineSuffix = (explicitSearchMatch[3] || '').trim().toLowerCase();
          const rawEngine = rawEnginePrefix || rawEngineSuffix;
          const engine = searchEngineMap[rawEngine] || 'google';

          let query = normalizeQuotedValue(explicitSearchMatch[2] || '');
          query = query.replace(/^(?:the\s+web|web)\s+(?:for\s+)?/i, '').trim();

          if (query) {
            const message = await invokeSystemCommand<string>('search_web', { query, engine });
            return { handled: true, message };
          }
        }

        const playMatch = input.match(/^play\s+(.+?)(?:\s+on\s+youtube)?$/i);
        if (playMatch) {
          const query = normalizeQuotedValue(playMatch[1]);
          const message = await invokeSystemCommand<string>('search_web', { query, engine: 'youtube' });
          return { handled: true, message };
        }
      }

      const applicationMatch = input.match(/^(?:open|launch|start)\s+(.+)$/i);
      if (applicationMatch) {
        const name = normalizeQuotedValue(applicationMatch[1]);
        const message = await invokeSystemCommand<string>('open_application', { name });
        return { handled: true, message };
      }

      return { handled: false };
    } catch (error) {
      const mapped = ErrorManager.mapProviderError('System Control', error);
      return { handled: true, error: mapped };
    }
  }
}

export const systemControl = new SystemControl();
export default systemControl;
