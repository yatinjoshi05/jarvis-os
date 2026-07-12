import { ProviderStatus } from './types';

/**
 * Metadata associated with active providers.
 */
export interface ProviderState {
  id: string;
  status: ProviderStatus;
  uptime: number;
}
