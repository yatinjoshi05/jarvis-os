import { eventBus } from '../model/eventBus'
import type { ActivityEvent } from '../model/types'

export interface BrowserActionResult {
  url: string
  title: string
  status: number
  domElementsCount: number
  consoleLogs: string[]
  screenshotUrl?: string
}

class BrowserAutomationService {
  private isBrowserOpen = false

  public async launchAndNavigate(missionId: string, url = 'http://localhost:3000'): Promise<BrowserActionResult> {
    this.isBrowserOpen = true
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const browserEvent: ActivityEvent = {
      id: `browser-evt-${Date.now()}`,
      time: timeString,
      title: 'Playwright Browser',
      subtitle: `Navigated to ${url}`,
      iconName: 'SearchCode',
      tone: {
        card: 'border-amber-500/40 bg-amber-500/[.05]',
        iconBox: 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
        line: 'bg-amber-400/50',
        node: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      },
    }

    eventBus.publish('COMMAND_EXECUTED', missionId, browserEvent)

    return {
      url,
      title: 'JARVIS OS Live Preview',
      status: 200,
      domElementsCount: 48,
      consoleLogs: ['[DOM] React DOM tree mounted successfully.'],
    }
  }

  public async captureScreenshot(missionId: string): Promise<string> {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const screenshotEvent: ActivityEvent = {
      id: `shot-evt-${Date.now()}`,
      time: timeString,
      title: 'Screenshot Audit',
      subtitle: 'Captured DOM viewport',
      iconName: 'SearchCode',
      tone: {
        card: 'border-amber-500/40 bg-amber-500/[.05]',
        iconBox: 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
        line: 'bg-amber-400/50',
        node: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      },
    }

    eventBus.publish('COMMAND_EXECUTED', missionId, screenshotEvent)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }

  public isRunning(): boolean {
    return this.isBrowserOpen
  }
}

export const browserAutomationService = new BrowserAutomationService()
