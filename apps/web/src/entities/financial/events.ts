export const FinancialEntityEvents = {
  ENTRY_POSTED: 'financial-entity:entry_posted',
  FINANCIAL_PROFILE_UPDATED: 'financial:profile_updated',
  GOAL_CREATED: 'financial:goal_created',
  GOAL_COMPLETED: 'financial:goal_completed',
  PORTFOLIO_UPDATED: 'financial:portfolio_updated',
  INVESTMENT_CREATED: 'financial:investment_created',
  INSURANCE_CREATED: 'financial:insurance_created',
  REPORT_GENERATED: 'financial:report_generated',
} as const;

export type FinancialEntityEvent = typeof FinancialEntityEvents[keyof typeof FinancialEntityEvents];

type FinancialEventListener = (data: any) => void;

class FinancialEventEmitter {
  private listeners: Map<string, Set<FinancialEventListener>> = new Map();

  public on(event: string, listener: FinancialEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: FinancialEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  public emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in financial event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const financialEventEmitter = new FinancialEventEmitter();
export default financialEventEmitter;
