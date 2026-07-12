/**
 * Contact modification events.
 */
export const CrmEvents = {
  CONTACT_CREATED: 'crm:contact_created',
  CONTACT_UPDATED: 'crm:contact_updated',
} as const;

export type CrmEvent = typeof CrmEvents[keyof typeof CrmEvents];
