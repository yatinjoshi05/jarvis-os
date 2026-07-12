/**
 * Flow triggers emitted by authentication features.
 */
export const AuthFlowEvents = {
  MFA_REQUIRED: 'auth-flow:mfa_required',
  SUCCESS: 'auth-flow:success',
  FAILURE: 'auth-flow:failure',
} as const;

export type AuthFlowEvent = typeof AuthFlowEvents[keyof typeof AuthFlowEvents];
