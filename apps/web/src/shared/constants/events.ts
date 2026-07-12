/**
 * Events related to system constant loading.
 */
export const ConstantEvents = {
  INITIALIZED: 'constants:initialized',
} as const;

export type ConstantEvent = typeof ConstantEvents[keyof typeof ConstantEvents];
