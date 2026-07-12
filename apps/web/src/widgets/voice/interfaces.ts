import { VoiceWidgetVisualizationState } from './types';

/**
 * Wave panel properties.
 */
export interface VoiceWidgetProps {
  state: VoiceWidgetVisualizationState;
  color?: string;
  rmsValue: number;
}
