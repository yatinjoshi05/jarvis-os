import { FINANCIAL_CONFIG } from './config';
import { CalculationFailureError } from './errors';

export class FinancialCalculators {
  public static calculateSIP(monthlyInvestment: number, annualRate: number, tenureYears: number): number {
    try {
      const i = annualRate / 12 / 100;
      const n = tenureYears * 12;
      if (i === 0) return monthlyInvestment * n;
      return monthlyInvestment * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    } catch (e: any) {
      throw new CalculationFailureError('SIP Calculator', e.message);
    }
  }

  public static calculateLumpsum(principal: number, annualRate: number, tenureYears: number): number {
    try {
      return principal * Math.pow(1 + annualRate / 100, tenureYears);
    } catch (e: any) {
      throw new CalculationFailureError('Lumpsum Calculator', e.message);
    }
  }

  public static calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    try {
      const r = annualRate / 12 / 100;
      if (r === 0) return principal / tenureMonths;
      const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
      return emi;
    } catch (e: any) {
      throw new CalculationFailureError('EMI Calculator', e.message);
    }
  }

  public static calculateRetirement(
    monthlyExpense: number,
    currentAge: number,
    retirementAge: number,
    lifeExpectancy: number
  ): { targetCorpus: number; requiredSIP: number } {
    try {
      const inflation = FINANCIAL_CONFIG.inflationRatePercent;
      const yearsToRetire = retirementAge - currentAge;
      const retirementTenure = lifeExpectancy - retirementAge;

      // Adjust monthly expenses for inflation at retirement
      const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
      const annualRetirementExpense = adjustedMonthlyExpense * 12;

      // Assume post-retirement yield of 8% (inflation adjusted net rate: 8% - 6% = 2%)
      const netPostRetirementRate = 2; // net inflation-adjusted return rate
      const r = netPostRetirementRate / 100;
      const n = retirementTenure;

      // Corpus required at retirement (Present value of an annuity due)
      let targetCorpus = annualRetirementExpense * n;
      if (r > 0) {
        targetCorpus = annualRetirementExpense * ((1 - Math.pow(1 + r, -n)) / r) * (1 + r);
      }

      // Monthly savings (SIP) required during pre-retirement phase (pre-retirement rate: 12% yield, inflation adjusted is 6%)
      const preRetirementNetRate = 6;
      const requiredSIP = targetCorpus / (((Math.pow(1 + preRetirementNetRate / 12 / 100, yearsToRetire * 12) - 1) / (preRetirementNetRate / 12 / 100)) * (1 + preRetirementNetRate / 12 / 100));

      return {
        targetCorpus,
        requiredSIP
      };
    } catch (e: any) {
      throw new CalculationFailureError('Retirement Calculator', e.message);
    }
  }

  public static calculateGoal(
    targetAmount: number,
    yearsRemaining: number,
    currentSavings: number,
    annualRate = 12
  ): number {
    try {
      const futureValueOfSavings = this.calculateLumpsum(currentSavings, annualRate, yearsRemaining);
      const remainingTarget = targetAmount - futureValueOfSavings;
      if (remainingTarget <= 0) return 0;

      const i = annualRate / 12 / 100;
      const n = yearsRemaining * 12;
      if (i === 0) return remainingTarget / n;

      return remainingTarget / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    } catch (e: any) {
      throw new CalculationFailureError('Goal Calculator', e.message);
    }
  }

  public static calculateInflation(amount: number, years: number, rate = FINANCIAL_CONFIG.inflationRatePercent): number {
    return amount * Math.pow(1 + rate / 100, years);
  }

  public static calculateLoanEligibility(monthlyIncome: number, monthlyEMIs: number, interestRate = 9, tenureMonths = 240): number {
    try {
      const foirLimit = monthlyIncome * 0.5; // FOIR cap at 50%
      const availableEMI = foirLimit - monthlyEMIs;
      if (availableEMI <= 0) return 0;

      // Reverse EMI calculation to find principal eligibility
      const r = interestRate / 12 / 100;
      const principal = (availableEMI * (Math.pow(1 + r, tenureMonths) - 1)) / (r * Math.pow(1 + r, tenureMonths));
      return principal;
    } catch (e: any) {
      throw new CalculationFailureError('Loan Eligibility Calculator', e.message);
    }
  }

  public static calculateInsuranceNeed(annualIncome: number, liabilities: number, dependentsCount: number): number {
    const factors = FINANCIAL_CONFIG.insuranceNeedFactors;
    const termNeed = (annualIncome * factors.incomeMultiplier) + liabilities + (dependentsCount * factors.dependentCoveragePerHead);
    return termNeed;
  }

  public static calculateTax(annualIncome: number): number {
    try {
      let remainingIncome = annualIncome;
      let tax = 0;
      let previousLimit = 0;

      for (const bracket of FINANCIAL_CONFIG.taxBrackets) {
        const currentLimit = bracket.limit;
        const taxableAmountInBracket = Math.min(remainingIncome, currentLimit - previousLimit);
        
        if (taxableAmountInBracket <= 0) break;

        tax += taxableAmountInBracket * bracket.rate;
        remainingIncome -= taxableAmountInBracket;
        previousLimit = currentLimit;
      }

      return tax;
    } catch (e: any) {
      throw new CalculationFailureError('Tax Estimator', e.message);
    }
  }

  public static calculateCompoundInterest(
    principal: number,
    annualRate: number,
    timesCompoundedPerYear: number,
    tenureYears: number
  ): number {
    try {
      if (principal < 0 || annualRate < 0 || timesCompoundedPerYear <= 0 || tenureYears < 0) {
        throw new Error('Invalid calculation inputs');
      }
      const r = annualRate / 100;
      const n = timesCompoundedPerYear;
      const t = tenureYears;
      return principal * Math.pow(1 + r / n, n * t);
    } catch (e: any) {
      throw new CalculationFailureError('Compound Interest Calculator', e.message);
    }
  }
}
export default FinancialCalculators;
