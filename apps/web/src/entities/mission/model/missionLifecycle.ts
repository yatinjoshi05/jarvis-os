import type { RuntimeState } from './types'

// Allowed State Transitions Graph
const VALID_TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  draft: ['queued', 'planning', 'cancelled'],
  queued: ['planning', 'running', 'cancelled'],
  planning: ['running', 'failed', 'cancelled'],
  awaiting: ['running', 'planning', 'cancelled'],
  running: ['paused', 'waiting', 'verifying', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled', 'failed'],
  waiting: ['running', 'paused', 'failed', 'cancelled'],
  verifying: ['completed', 'failed', 'running'],
  completed: ['archived', 'running', 'planning'], // Allow restart
  failed: ['running', 'planning', 'archived'],    // Allow retry
  cancelled: ['archived', 'running'],
  archived: ['draft'],
}

/**
 * Validates whether a lifecycle state transition from `from` to `to` is permitted.
 */
export function validateStateTransition(from: RuntimeState, to: RuntimeState): boolean {
  if (from === to) return true
  const allowed = VALID_TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}
