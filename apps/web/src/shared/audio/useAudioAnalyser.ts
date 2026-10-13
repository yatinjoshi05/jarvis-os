import { useState, useEffect } from 'react';
import microphoneManager from '../ai/MicrophoneManager';
import { globeStateManager } from '../../entities/globe/model/GlobeStateManager';

export interface AudioAnalyserData {
  voiceLevel: number;
  isSpeaking: boolean;
  getFrequencyBands: () => { bass: number; mid: number; treble: number };
}

/**
 * Single shared Web Audio Analyser hook for Globe components & animation layers.
 * Reads live audio amplitude from MicrophoneManager without duplicating Web Audio nodes.
 */
export function useAudioAnalyser(): AudioAnalyserData {
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let animId: number;

    const tick = () => {
      microphoneManager.update();
      const lvl = microphoneManager.voiceLevel;
      setVoiceLevel(lvl);
      setIsSpeaking(microphoneManager.isUserSpeaking());

      // Forward real-time live amplitude to GlobeStateManager
      globeStateManager.setMicrophoneAmplitude(lvl);
      globeStateManager.setMusicFFT(
        Math.min(1.0, lvl * 1.5),
        Math.min(1.0, lvl * 1.2),
        Math.min(1.0, lvl * 0.9)
      );

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const getFrequencyBands = () => {
    const lvl = microphoneManager.voiceLevel;
    return {
      bass: Math.min(1.0, lvl * 1.5),
      mid: Math.min(1.0, lvl * 1.2),
      treble: Math.min(1.0, lvl * 0.9),
    };
  };

  return {
    voiceLevel,
    isSpeaking,
    getFrequencyBands,
  };
}

export default useAudioAnalyser;
