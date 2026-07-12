/**
 * Transaction statements events.
 */
export const FinancialEvents = {
  TRANSACTION_ADDED: 'financial:transaction_added',
  BUDGET_EXCEEDED: 'financial:budget_exceeded',
} as const;

export type FinancialEvent = typeof FinancialEvents[keyof typeof FinancialEvents];
