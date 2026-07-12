import { WidgetGridSize } from './types';

/**
 * UI position parameters.
 */
export interface DashboardWidgetLayout {
  widgetId: string;
  colSpan: number;
  rowSpan: number;
  size: WidgetGridSize;
}

/**
 * Dashboard settings layout preferences.
 */
export interface DashboardSettings {
  columns: number;
  layouts: DashboardWidgetLayout[];
}
