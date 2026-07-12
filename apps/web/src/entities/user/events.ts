/**
 * User updates actions.
 */
export const UserEntityEvents = {
  PROFILE_UPDATED: 'user-entity:profile_updated',
} as const;

export type UserEntityEvent = typeof UserEntityEvents[keyof typeof UserEntityEvents];
