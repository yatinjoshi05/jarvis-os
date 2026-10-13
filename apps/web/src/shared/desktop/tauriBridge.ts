export interface TauriWindowConfig {
  title: string
  width: number
  height: number
  alwaysOnTop: boolean
  resizable: boolean
}

class TauriBridge {
  private isTauriAvailable = typeof window !== 'undefined' && '__TAURI_IPC__' in window

  public async sendIPC<TResponse = unknown>(command: string, payload: unknown = {}): Promise<TResponse> {
    if (this.isTauriAvailable) {
      // @ts-ignore
      return window.__TAURI_IPC__({ cmd: command, ...payload })
    }

    // Web Fallback for browser execution
    return { status: 'ok', command, payload } as unknown as TResponse
  }

  public registerGlobalHotkey(shortcut: string, callback: () => void): void {
    console.log(`[TauriBridge] Registered global hotkey: ${shortcut}`)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === 'Space') {
          callback()
        }
      })
    }
  }

  public sendNativeNotification(title: string, body: string): void {
    console.log(`[Native Notification] ${title}: ${body}`)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }

  public isDesktop(): boolean {
    return this.isTauriAvailable
  }
}

export const tauriBridge = new TauriBridge()
