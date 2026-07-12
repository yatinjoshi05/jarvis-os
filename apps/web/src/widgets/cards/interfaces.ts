import { CardWidgetType } from './types';

/**
 * Grid card properties.
 */
export interface CardWidgetProps {
  id: string;
  type: CardWidgetType;
  title: string;
  data: unknown;
}
