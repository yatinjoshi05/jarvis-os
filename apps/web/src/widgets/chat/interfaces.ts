import { ChatWidgetLayout } from './types';

/**
 * Dialogue panel properties.
 */
export interface ChatWidgetProps {
  sessionId: string;
  layout: ChatWidgetLayout;
  showAvatars: boolean;
}
