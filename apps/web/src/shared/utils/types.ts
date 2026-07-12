/**
 * Signature type for debounced function return wrappers.
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;
