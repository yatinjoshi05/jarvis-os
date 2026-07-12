import { Environment } from './types';

/**
 * Application configuration settings.
 */
export interface AppConfig {
  env: Environment;
  debug: boolean;
  version: string;
}
