import { AccountType } from './types';

/**
 * Cash balance account model.
 */
export interface AccountEntity {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

/**
 * Audit ledger entry record.
 */
export interface LedgerEntry {
  id: string;
  accountId: string;
  amount: number;
  hash: string;
}
