/**
 * Event names emitted by the API module.
 */
export const ApiEvents = {
  REQUEST_START: 'api:request_start',
  REQUEST_SUCCESS: 'api:request_success',
  REQUEST_FAILURE: 'api:request_failure',
} as const;

export type ApiEvent = typeof ApiEvents[keyof typeof ApiEvents];
