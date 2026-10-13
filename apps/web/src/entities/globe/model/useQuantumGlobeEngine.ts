import { useState, useEffect } from 'react';
import { quantumGlobeEngine } from './QuantumGlobeEngine';
import {
  GlobeState,
  GlobeMood,
  GlobeAnimationParams,
  GlobeDebugConfig,
} from './GlobeTypes';

export interface UseQuantumGlobeEngineResult {
  state: GlobeState;
  mood: GlobeMood;
  params: GlobeAnimationParams;
  debugConfig: GlobeDebugConfig;
}

export function useQuantumGlobeEngine(): UseQuantumGlobeEngineResult {
  const [data, setData] = useState<UseQuantumGlobeEngineResult>({
    state: quantumGlobeEngine.getState(),
    mood: quantumGlobeEngine.getMood(),
    params: quantumGlobeEngine.getParams(),
    debugConfig: quantumGlobeEngine.getDebugConfig(),
  });

  useEffect(() => {
    return quantumGlobeEngine.subscribe((state, mood, params) => {
      setData({
        state,
        mood,
        params: { ...params },
        debugConfig: quantumGlobeEngine.getDebugConfig(),
      });
    });
  }, []);

  return data;
}

export default useQuantumGlobeEngine;
