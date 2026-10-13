export interface OSNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
}

class NotificationEngine {
  private notifications: OSNotification[] = []

  public notify(title: string, message: string, type: OSNotification['type'] = 'info'): void {
    const notification: OSNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    }
    this.notifications.push(notification)
    console.log(`[JARVIS Notification] ${title}: ${message}`)
  }

  public getHistory(): OSNotification[] {
    return [...this.notifications]
  }
}

export const notificationEngine = new NotificationEngine()
