/**
 * Navigation action events.
 */
export const HeaderWidgetEvents = {
  NAV_ITEM_CLICKED: 'header-widget:nav_item_clicked',
} as const;

export type HeaderWidgetEvent = typeof HeaderWidgetEvents[keyof typeof HeaderWidgetEvents];
