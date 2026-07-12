/**
 * Grid layout updates.
 */
export const DashboardEvents = {
  LAYOUT_CHANGED: 'dashboard:layout_changed',
  WIDGET_ADDED: 'dashboard:widget_added',
} as const;

export type DashboardEvent = typeof DashboardEvents[keyof typeof DashboardEvents];
