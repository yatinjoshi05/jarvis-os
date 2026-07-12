import { AssistantWidgetViewMode } from './types';

/**
 * Assistant properties interface.
 */
export interface AssistantWidgetProps {
  id: string;
  initialMode?: AssistantWidgetViewMode;
  visible: boolean;
}
