/**
 * Callback type executed upon store changes.
 */
export type StoreListener<T> = (state: T) => void;
