/**
 * Asset modifications events.
 */
export const PortfolioEntityEvents = {
  ASSET_VALUE_CHANGED: 'portfolio-entity:asset_value_changed',
} as const;

export type PortfolioEntityEvent = typeof PortfolioEntityEvents[keyof typeof PortfolioEntityEvents];
