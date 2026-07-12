import { DbDriver } from './types';

/**
 * Database connection settings.
 */
export interface DbConnectionOptions {
  driver: DbDriver;
  host?: string;
  port?: number;
  databaseName: string;
}
