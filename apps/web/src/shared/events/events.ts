/**
 * Event emitter internal states.
 */
export const EventBusStates = {
  ACTIVE: 'eventbus:active',
  PAUSED: 'eventbus:paused',
} as const;

export type EventBusState = typeof EventBusStates[keyof typeof EventBusStates];
