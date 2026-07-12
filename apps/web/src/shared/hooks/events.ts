/**
 * React hook lifecycle event triggers (for telemetry or logs).
 */
export const HookLifecycleEvents = {
  MOUNTED: 'hook:mounted',
  UNMOUNTED: 'hook:unmounted',
} as const;

export type HookLifecycleEvent = typeof HookLifecycleEvents[keyof typeof HookLifecycleEvents];
