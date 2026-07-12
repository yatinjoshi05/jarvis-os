import { ProviderType } from './types';

/**
 * Active processing engine record.
 */
export interface ProviderEntity {
  id: string;
  name: string;
  type: ProviderType;
  active: boolean;
}

/**
 * Core performance tolerances parameters.
 */
export interface ProviderCapabilities {
  maxTokens?: number;
  supportsStreaming: boolean;
  averageLatencyMs: number;
}
