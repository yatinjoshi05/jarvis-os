import { SpeechEngine } from './types';

/**
 * Voice audio input capture settings.
 */
export interface AudioInputConfig {
  sampleRate: number;
  channels: number;
  engine: SpeechEngine;
}
