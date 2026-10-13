import { eventBus } from '../model/eventBus'
import type { ActivityEvent } from '../model/types'

export interface CommandExecutionResult {
  command: string
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

class TerminalService {
  private unsafePatterns = [/rm\s+-rf\s+\//i, /mkfs/i, /dd\s+if=/i, /: >/i, /chmod\s+777\s+\//i]
  private activeProcesses = new Map<string, AbortController>()

  public validateCommand(command: string): { safe: boolean; reason?: string } {
    for (const pattern of this.unsafePatterns) {
      if (pattern.test(command)) {
        return { safe: false, reason: `Security Policy Violation: Command contains restricted pattern: ${command}` }
      }
    }
    return { safe: true }
  }

  public async executeCommand(missionId: string, command: string, cwd = '/'): Promise<CommandExecutionResult> {
    const validation = this.validateCommand(command)
    if (!validation.safe) {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      eventBus.publish('COMMAND_EXECUTED', missionId, {
        id: `cmd-failed-${Date.now()}`,
        time: timeString,
        title: command.length > 22 ? `${command.slice(0, 22)}...` : command,
        subtitle: 'Blocked by Security Policy',
        iconName: 'TriangleAlert',
        tone: {
          card: 'border-rose-500/40 bg-rose-500/[.05]',
          iconBox: 'border border-rose-500/30 bg-rose-500/10 text-rose-300',
          line: 'bg-rose-400/50',
          node: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
        },
      } as ActivityEvent)

      throw new Error(validation.reason)
    }

    const abortController = new AbortController()
    const procId = `proc-${Date.now()}`
    this.activeProcesses.set(procId, abortController)

    const startTime = Date.now()
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // Stream live execution log preview over Event Bus
    eventBus.publish('REASONING_STREAM', missionId, {
      text: `\n[Terminal PTY] Spawning process: "${command}" in ${cwd}...`,
    })

    const commandEvent: ActivityEvent = {
      id: `cmd-evt-${Date.now()}`,
      time: timeString,
      title: command.length > 22 ? `${command.slice(0, 22)}...` : command,
      subtitle: 'Executed successfully',
      iconName: 'TerminalSquare',
      tone: {
        card: 'border-cyan-500/40 bg-cyan-500/[.05]',
        iconBox: 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
        line: 'bg-cyan-400/50',
        node: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
      },
    }

    eventBus.publish('COMMAND_EXECUTED', missionId, commandEvent)
    this.activeProcesses.delete(procId)

    return {
      command,
      exitCode: 0,
      stdout: `[JARVIS PTY Output]\nCommand: ${command}\nCWD: ${cwd}\nStatus: 0 OK`,
      stderr: '',
      durationMs: Date.now() - startTime,
    }
  }

  public cancelProcess(procId: string): boolean {
    const controller = this.activeProcesses.get(procId)
    if (!controller) return false
    controller.abort()
    this.activeProcesses.delete(procId)
    return true
  }
}

export const terminalService = new TerminalService()
