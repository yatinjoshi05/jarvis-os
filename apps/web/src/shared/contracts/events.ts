/**
 * Contract compliance event types.
 */
export const ContractEvents = {
  VERIFIED: 'contract:verified',
  VIOLATED: 'contract:violated',
} as const;

export type ContractEvent = typeof ContractEvents[keyof typeof ContractEvents];
