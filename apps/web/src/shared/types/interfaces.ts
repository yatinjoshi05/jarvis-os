/**
 * Represents a standard identified record.
 */
export interface Identifiable {
  id: string;
  createdAt: number;
  updatedAt?: number;
}
