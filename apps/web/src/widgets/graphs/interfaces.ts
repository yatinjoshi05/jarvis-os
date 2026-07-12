import { GraphWidgetType } from './types';

/**
 * Chart properties.
 */
export interface GraphWidgetProps {
  id: string;
  type: GraphWidgetType;
  datasets: unknown[];
  animate?: boolean;
}
