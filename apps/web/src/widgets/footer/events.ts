/**
 * Footer link click actions events.
 */
export const FooterWidgetEvents = {
  LINK_CLICKED: 'footer-widget:link_clicked',
} as const;

export type FooterWidgetEvent = typeof FooterWidgetEvents[keyof typeof FooterWidgetEvents];
