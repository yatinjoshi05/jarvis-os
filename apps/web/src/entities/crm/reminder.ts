import { Reminder } from './interfaces';
import { notificationManager } from '../../shared/dashboard';
import { crmEventEmitter, CRMEvents } from './events';

export class ReminderEngine {
  private reminders: Reminder[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const stored = localStorage.getItem('jarvis_crm_reminders');
      if (stored) {
        this.reminders = JSON.parse(stored) as Reminder[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_crm_reminders', JSON.stringify(this.reminders));
    } catch (_) { /* ignore */ }
  }

  public addReminder(reminder: Omit<Reminder, 'id' | 'isFired' | 'createdAt'>): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isFired: false,
      createdAt: Date.now()
    };
    this.reminders.push(newReminder);
    this.saveData();
    return newReminder;
  }

  public getReminders(userId?: string): Reminder[] {
    if (userId) {
      return this.reminders.filter((r) => r.userId === userId);
    }
    return this.reminders;
  }

  public getPendingReminders(userId?: string): Reminder[] {
    return this.getReminders(userId).filter((r) => !r.isFired);
  }

  /**
   * Scans for reminders whose trigger time has passed, triggers notifications, and marks as fired.
   */
  public checkReminders(): number {
    const now = Date.now();
    let firedCount = 0;

    this.reminders.forEach((r) => {
      if (!r.isFired && r.triggerTime <= now) {
        r.isFired = true;
        firedCount++;

        // Trigger system notification
        notificationManager.showNotification(
          r.type === 'meeting' || r.type === 'goal_review' ? 'info' : 'warning',
          `Reminder: ${r.title}`,
          r.description
        );

        if (r.type === 'follow-up') {
          crmEventEmitter.emit(CRMEvents.FOLLOWUP_CREATED, { reminderId: r.id, title: r.title });
        }
      }
    });

    if (firedCount > 0) {
      this.saveData();
    }

    return firedCount;
  }

  public clearReminders(userId?: string) {
    if (userId) {
      this.reminders = this.reminders.filter((r) => r.userId !== userId);
    } else {
      this.reminders = [];
    }
    this.saveData();
  }
}

export const reminderEngine = new ReminderEngine();
export default reminderEngine;
