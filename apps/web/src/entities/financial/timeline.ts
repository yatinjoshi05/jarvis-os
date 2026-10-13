import { FinancialMilestone } from './interfaces';

export class FinancialTimeline {
  private milestones: FinancialMilestone[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const stored = localStorage.getItem('jarvis_financial_timeline');
      if (stored) {
        this.milestones = JSON.parse(stored) as FinancialMilestone[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_financial_timeline', JSON.stringify(this.milestones));
    } catch (_) { /* ignore */ }
  }

  public addMilestone(userId: string, milestone: Omit<FinancialMilestone, 'id' | 'userId' | 'timestamp'> & { timestamp?: number }) {
    const entry: FinancialMilestone = {
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: milestone.type,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      timestamp: milestone.timestamp || Date.now()
    };
    this.milestones.push(entry);
    this.saveData();
  }

  public getTimeline(userId: string): FinancialMilestone[] {
    return this.milestones
      .filter((m) => m.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public getReminders(userId: string): FinancialMilestone[] {
    return this.milestones
      .filter((m) => m.userId === userId && m.type === 'reminder')
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public clear(userId: string) {
    this.milestones = this.milestones.filter((m) => m.userId !== userId);
    this.saveData();
  }
}

export const financialTimeline = new FinancialTimeline();
export default financialTimeline;
