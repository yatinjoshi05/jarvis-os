import { AccountType, GoalCategory, RiskCategory, InvestmentType, InsuranceType, TransactionCategory, DocumentType } from './types';


export interface AccountEntity {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  amount: number;
  hash: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  personalInfo: {
    fullName: string;
    occupation: string;
    dependentsCount: number;
    age: number;
  };
  financialMetrics: {
    annualIncome: number;
    monthlyExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
  };
  riskScore: number;
  riskCategory: RiskCategory;
  investmentExperience: 'none' | 'basic' | 'advanced';
  goals: Goal[];
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  category: GoalCategory;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: number; // timestamp
  isCompleted: boolean;
}

export interface Holding {
  symbol: string;
  name: string;
  assetClass: 'equity' | 'fixed_income' | 'gold' | 'cash';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  holdings: Holding[];
  cashBalance: number;
  updatedAt: number;
}

export interface Investment {
  id: string;
  userId: string;
  type: InvestmentType;
  name: string;
  amount: number;
  startDate: number;
  frequency?: 'monthly' | 'quarterly' | 'yearly'; // for SIP
  nextExecutionDate?: number;
  status: 'active' | 'completed' | 'paused';
}

export interface Insurance {
  id: string;
  userId: string;
  type: InsuranceType;
  policyName: string;
  provider: string;
  sumAssured: number;
  premium: number;
  premiumFrequency: 'monthly' | 'yearly';
  startDate: number;
  nextPremiumDate: number;
  status: 'active' | 'lapsed';
}

export interface RiskProfile {
  score: number;
  category: RiskCategory;
  suitability: {
    equityAllocationPercent: number;
    debtAllocationPercent: number;
    goldAllocationPercent: number;
    cashAllocationPercent: number;
  };
}

export interface Recommendation {
  id: string;
  userId: string;
  category: 'goal' | 'investment' | 'insurance' | 'portfolio' | 'risk';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface FinancialReport {
  id: string;
  userId: string;
  netWorth: number;
  cashFlow: {
    monthlySurplus: number;
    savingsRatePercent: number;
  };
  goalProgressPercent: number;
  insuranceGap: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  timestamp: number;
}

export interface BudgetPlan {
  category: string;
  limitAmount: number;
  spentAmount: number;
}

export interface FinancialDocument {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  uploadDate: number;
  fileUrl: string;
  status: 'pending' | 'processed' | 'failed';
  extractedData?: {
    provider?: string;
    amount?: number;
    date?: number;
    premium?: number;
    coverage?: number;
    holdings?: Holding[];
    text?: string;
  };
}

export interface FinancialMilestone {
  id: string;
  userId: string;
  type: 'transaction' | 'investment' | 'insurance' | 'goal' | 'milestone' | 'reminder';
  title: string;
  description: string;
  timestamp: number;
  amount?: number;
}

// Future Compatibility Interfaces for provider APIs
export interface BrokerProvider {
  id: string;
  name: string;
  syncHoldings(userId: string): Promise<Holding[]>;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  getPolicies(userId: string): Promise<Insurance[]>;
}

export interface BankProvider {
  id: string;
  name: string;
  getAccounts(userId: string): Promise<AccountEntity[]>;
}

export interface MutualFundProvider {
  id: string;
  name: string;
  getSIPs(userId: string): Promise<Investment[]>;
}

export interface UPIProvider {
  id: string;
  initiatePayment(userId: string, amount: number, payee: string): Promise<boolean>;
}

export interface AccountAggregatorProvider {
  id: string;
  fetchConsentData(userId: string, consentId: string): Promise<any>;
}

export interface TaxPlatformProvider {
  id: string;
  fileReturns(userId: string, report: FinancialReport): Promise<boolean>;
}

export interface CreditScoreProvider {
  id: string;
  fetchScore(userId: string): Promise<number>;
}

export interface OpenBankingProvider {
  id: string;
  fetchTransactions(userId: string, accountId: string): Promise<Transaction[]>;
}

