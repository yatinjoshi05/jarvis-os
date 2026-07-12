import { DashboardWidgetId } from './types';

/**
 * Main dashboard properties.
 */
export interface DashboardWidgetProps {
  layoutId: string;
  activeWidgets: DashboardWidgetId[];
  editable: boolean;
}
