import { TerminalWidgetTheme } from './types';

/**
 * Terminal UI properties.
 */
export interface TerminalWidgetProps {
  sessionId: string;
  theme?: TerminalWidgetTheme;
  showStatusLine?: boolean;
}
