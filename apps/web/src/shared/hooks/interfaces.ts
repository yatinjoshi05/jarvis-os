import { HookState } from './types';

/**
 * Return type structure for generic async execution hooks.
 */
export interface UseAsyncReturn<T, E = Error> {
  state: HookState;
  data: T | null;
  error: E | null;
  execute: () => Promise<void>;
}
