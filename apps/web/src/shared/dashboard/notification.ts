import { Notification } from './interfaces';
import { dashboardStore } from './store';
import { dashboardEventEmitter, DashboardEvents } from './events';
import { DASHBOARD_CONFIG } from './config';

class NotificationManager {
  public getNotifications(): Notification[] {
    return dashboardStore.getState().notifications;
  }

  public showNotification(
    type: Notification['type'],
    title: string,
    message: string,
    duration = DASHBOARD_CONFIG.toastDurationMs
  ): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: Notification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
      isRead: false,
      duration
    };

    const current = this.getNotifications();
    dashboardStore.setState({ notifications: [...current, newNotif] });

    dashboardEventEmitter.emit(DashboardEvents.NOTIFICATION_CREATED, newNotif);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public markAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    dashboardStore.setState({ notifications: updated });
  }

  public dismiss(id: string) {
    const list = this.getNotifications();
    const updated = list.filter((n) => n.id !== id);
    dashboardStore.setState({ notifications: updated });
  }

  public clearAll() {
    dashboardStore.setState({ notifications: [] });
  }
}

export const notificationManager = new NotificationManager();
export default notificationManager;
