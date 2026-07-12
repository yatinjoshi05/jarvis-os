import { ServiceState } from './types';

/**
 * Shared interface defining a standard system service.
 */
export interface BaseService {
  id: string;
  state: ServiceState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
