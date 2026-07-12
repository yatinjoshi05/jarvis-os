/**
 * Queries execution events.
 */
export const SearchEvents = {
  QUERY_SUBMITTED: 'search:query_submitted',
  RESULTS_FOUND: 'search:results_found',
} as const;

export type SearchEvent = typeof SearchEvents[keyof typeof SearchEvents];
