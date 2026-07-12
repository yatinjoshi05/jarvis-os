import { MemoryScope } from './types';

/**
 * Structure of a single memory storage record.
 */
export interface MemoryRecord<T = unknown> {
  key: string;
  scope: MemoryScope;
  value: T;
  createdAt: number;
  expiresAt?: number;
}
