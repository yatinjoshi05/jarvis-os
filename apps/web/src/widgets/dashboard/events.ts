/**
 * Position layout updates triggers.
 */
export const DashboardWidgetEvents = {
  TILE_DRAG_START: 'dashboard-widget:tile_drag_start',
} as const;

export type DashboardWidgetEvent = typeof DashboardWidgetEvents[keyof typeof DashboardWidgetEvents];
