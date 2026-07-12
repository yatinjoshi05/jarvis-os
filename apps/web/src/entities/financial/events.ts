/**
 * Financial account entities modification events.
 */
export const FinancialEntityEvents = {
  ENTRY_POSTED: 'financial-entity:entry_posted',
} as const;

export type FinancialEntityEvent = typeof FinancialEntityEvents[keyof typeof FinancialEntityEvents];
