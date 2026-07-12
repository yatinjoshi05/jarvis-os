/**
 * Emitted by long running utility pipelines.
 */
export const UtilityEvents = {
  PIPELINE_COMPLETE: 'utils:pipeline_complete',
} as const;

export type UtilityEvent = typeof UtilityEvents[keyof typeof UtilityEvents];
