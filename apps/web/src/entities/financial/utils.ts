export class FinancialUtils {
  /**
   * Currency formatter helper.
   */
  public static formatCurrency(amount: number, locale = 'en-US', currency = 'USD'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Percentage formatter helper.
   */
  public static formatPercent(ratio: number): string {
    return `${(ratio * 100).toFixed(1)}%`;
  }

  /**
   * Calculates monthly surplus/savings margin.
   */
  public static calculateSavingsRate(annualIncome: number, monthlyExpenses: number): number {
    const monthlyIncome = annualIncome / 12;
    if (monthlyIncome <= 0) return 0;
    const surplus = monthlyIncome - monthlyExpenses;
    return surplus / monthlyIncome;
  }

  /**
   * Calculates the number of months between two timestamps.
   */
  public static calculateMonthsBetween(d1: number, d2: number): number {
    const diffMs = Math.abs(d2 - d1);
    return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  }

  /**
   * Calculates the number of years between two timestamps.
   */
  public static calculateYearsBetween(d1: number, d2: number): number {
    const diffMs = Math.abs(d2 - d1);
    return diffMs / (1000 * 60 * 60 * 24 * 365.25);
  }

  /**
   * Computes the next payment or execution date based on frequency.
   */
  public static getNextFrequencyDate(startDate: number, frequency: 'monthly' | 'quarterly' | 'yearly'): number {
    const date = new Date(startDate);
    if (frequency === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      date.setMonth(date.getMonth() + 3);
    } else if (frequency === 'yearly') {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.getTime();
  }

  /**
   * Calculates CAGR (Compound Annual Growth Rate).
   */
  public static calculateCAGR(presentValue: number, futureValue: number, years: number): number {
    if (presentValue <= 0 || years <= 0) return 0;
    return Math.pow(futureValue / presentValue, 1 / years) - 1;
  }

  /**
   * Approximates IRR (Internal Rate of Return) for a series of periodic cash flows.
   */
  public static estimateIRR(cashFlows: { amount: number; days: number }[], guess = 0.1): number {
    let irr = guess;
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dNpv = 0;
      for (const cf of cashFlows) {
        const years = cf.days / 365;
        const discountFactor = Math.pow(1 + irr, years);
        npv += cf.amount / discountFactor;
        dNpv -= (cf.amount * years) / (discountFactor * (1 + irr));
      }
      if (Math.abs(npv) < tolerance) return irr;
      if (dNpv === 0) break;
      const nextIrr = irr - npv / dNpv;
      if (Math.abs(nextIrr - irr) < tolerance) return nextIrr;
      irr = nextIrr;
    }
    return irr;
  }

  /**
   * Simulates/estimates an insurance policy premium based on age, type and sum assured.
   */
  public static estimatePremium(age: number, sumAssured: number, type: string): number {
    let baseRate = 0.001; // Default 0.1% of sum assured
    if (type === 'health') baseRate = 0.015; // 1.5%
    else if (type === 'motor') baseRate = 0.03; // 3%
    else if (type === 'travel') baseRate = 0.005; // 0.5%
    
    const ageFactor = age < 30 ? 0.8 : age < 45 ? 1.2 : age < 60 ? 2.0 : 3.5;
    return sumAssured * baseRate * ageFactor;
  }

  /**
   * Calculates the savings/funding deficit for a goal.
   */
  public static calculateGoalDeficit(target: number, current: number): number {
    return Math.max(0, target - current);
  }

  /**
   * Numerically estimates the number of years needed to fund a goal with recurring contributions.
   */
  public static estimateYearsToGoal(target: number, current: number, monthlyContribution: number, annualRate = 8): number {
    const deficit = target - current;
    if (deficit <= 0) return 0;
    if (monthlyContribution <= 0) return Infinity;
    
    const r = annualRate / 12 / 100;
    if (r === 0) return deficit / (monthlyContribution * 12);
    
    let lowMonths = 0;
    let highMonths = 1200; // 100 years cap
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lowMonths + highMonths) / 2;
      const fv = current * Math.pow(1 + r, mid) + monthlyContribution * ((Math.pow(1 + r, mid) - 1) / r) * (1 + r);
      if (fv < target) {
        lowMonths = mid;
      } else {
        highMonths = mid;
      }
    }
    return lowMonths / 12;
  }
}
export default FinancialUtils;

