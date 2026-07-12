import { TransactionCategory } from './types';

/**
 * Cash transaction statement.
 */
export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  timestamp: number;
}

/**
 * Target budgets limit structures.
 */
export interface BudgetPlan {
  category: string;
  limitAmount: number;
  spentAmount: number;
}
