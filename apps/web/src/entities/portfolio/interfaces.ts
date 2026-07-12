import { AssetClass } from './types';

/**
 * Asset record schema.
 */
export interface PortfolioAsset {
  id: string;
  symbol: string;
  quantity: number;
  class: AssetClass;
}

/**
 * Asset evaluation values log.
 */
export interface PortfolioPerformance {
  assetId: string;
  costBasis: number;
  currentValue: number;
  timestamp: number;
}
