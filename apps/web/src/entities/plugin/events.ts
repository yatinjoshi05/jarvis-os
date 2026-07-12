/**
 * Engine plugin statuses triggers.
 */
export const PluginEntityEvents = {
  LOADED: 'plugin-entity:loaded',
  UNLOADED: 'plugin-entity:unloaded',
} as const;

export type PluginEntityEvent = typeof PluginEntityEvents[keyof typeof PluginEntityEvents];
