export const FINANCIAL_CONFIG = {
  inflationRatePercent: 6, // Default annual inflation
  riskToleranceWeights: {
    income: 0.3,
    expenses: 0.2,
    dependents: 0.2,
    experience: 0.3
  },
  taxBrackets: [
    { limit: 400000, rate: 0.0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 }
  ],
  defaultAssetAllocations: {
    conservative: { equity: 20, debt: 65, gold: 10, cash: 5 },
    moderate: { equity: 50, debt: 35, gold: 10, cash: 5 },
    aggressive: { equity: 80, debt: 10, gold: 5, cash: 5 }
  },
  insuranceNeedFactors: {
    incomeMultiplier: 10, // Sum assured should be 10x annual income
    dependentCoveragePerHead: 50000 // Additional cover per dependent
  },
  defaultInvestmentReturnsPercent: {
    SIP: 12,
    Mutual_Funds: 10,
    Stocks: 12,
    Bonds: 7,
    Gold: 8,
    ETF: 10,
    FD: 6.5,
    RD: 6.0,
    PPF: 7.1,
    NPS: 9.5
  },
  defaultCompoundInterestCompoundingFrequency: 4, // Quarterly
  defaultLoanInterestRatePercent: 9.0,
  defaultLoanTenureMonths: 240
};

export default FINANCIAL_CONFIG;
