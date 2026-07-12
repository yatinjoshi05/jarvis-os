import { PluginState } from './types';

/**
 * Plugin details database model.
 */
export interface PluginEntity {
  id: string;
  name: string;
  state: PluginState;
  installedAt: number;
}

/**
 * Plugins parameters manifest file specifications.
 */
export interface PluginManifest {
  id: string;
  version: string;
  entryPoint: string;
  requiredApiVersion: string;
}
