import { ContractStatus } from './types';

/**
 * Describes a system boundary communication contract.
 */
export interface ServiceContract {
  id: string;
  version: string;
  status: ContractStatus;
  signature: string;
}
