import { MemoryScope, MemoryCategory } from './types';

export interface MemoryMetadata {
  importance?: number; // 1-10 rating
  frequency?: number; // number of times accessed
  lastAccessed?: number; // timestamp
  tags?: string[];
  projectId?: string;
  workflowId?: string;
  custom?: Record<string, any>;
}

export interface MemoryRecord<T = any> {
  id: string;
  key: string;
  scope: MemoryScope;
  category: MemoryCategory;
  value: T;
  createdAt: number;
  updatedAt: number;
  metadata?: MemoryMetadata;
}

export interface MemoryScore {
  recency: number;
  importance: number;
  frequency: number;
  relevance: number;
  total: number;
}

export interface MemorySearchResult<T = any> {
  record: MemoryRecord<T>;
  score: MemoryScore;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface MemoryProvider {
  save(record: MemoryRecord): Promise<void>;
  load(id: string): Promise<MemoryRecord | null>;
  loadByKey(key: string, scope?: MemoryScope): Promise<MemoryRecord[]>;
  update(record: MemoryRecord): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string, scope?: MemoryScope, category?: MemoryCategory): Promise<MemoryRecord[]>;
  clear(scope?: MemoryScope): Promise<void>;
  healthCheck(): Promise<boolean>;
}
