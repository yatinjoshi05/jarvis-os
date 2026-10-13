import { useState, useEffect } from 'react';
import { globeStateManager, GlobeState, GlobeAnimationParams, GlobeDebugConfig } from './GlobeStateManager';

export interface UseGlobeStateResult {
  state: GlobeState;
  params: GlobeAnimationParams;
  debugConfig: GlobeDebugConfig;
}

export function useGlobeStateManager(): UseGlobeStateResult {
  const [data, setData] = useState<UseGlobeStateResult>({
    state: globeStateManager.getState(),
    params: globeStateManager.getParams(),
    debugConfig: globeStateManager.getDebugConfig(),
  });

  useEffect(() => {
    return globeStateManager.subscribe((state, params) => {
      setData({
        state,
        params: { ...params },
        debugConfig: globeStateManager.getDebugConfig(),
      });
    });
  }, []);

  return data;
}

export default useGlobeStateManager;
