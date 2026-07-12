/**
 * Chart hover events.
 */
export const GraphWidgetEvents = {
  DATA_POINT_HOVER: 'graph-widget:data_point_hover',
} as const;

export type GraphWidgetEvent = typeof GraphWidgetEvents[keyof typeof GraphWidgetEvents];
