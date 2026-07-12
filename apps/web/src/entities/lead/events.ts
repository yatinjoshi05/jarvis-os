/**
 * Lead status state updates.
 */
export const LeadEntityEvents = {
  LEAD_STATUS_CHANGED: 'lead-entity:status_changed',
} as const;

export type LeadEntityEvent = typeof LeadEntityEvents[keyof typeof LeadEntityEvents];
