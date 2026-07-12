import { SearchScope } from './types';

/**
 * Structured query options.
 */
export interface SearchQuery {
  rawText: string;
  scope: SearchScope;
  limit?: number;
}

/**
 * Structured search result fields.
 */
export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  score: number;
}
