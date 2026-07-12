/**
 * Structure representing a system event payload.
 */
export interface EventPayload<T = unknown> {
  id: string;
  topic: string;
  timestamp: number;
  data: T;
}
