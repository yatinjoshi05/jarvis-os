import { StoreListener } from './types';

/**
 * Minimal implementation structure of a state store.
 */
export interface StoreInstance<T> {
  getState: () => T;
  setState: (state: Partial<T>) => void;
  subscribe: (listener: StoreListener<T>) => () => void;
}
