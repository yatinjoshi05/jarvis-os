import { create } from 'zustand';
import { visionEngine, VisionAnalysisResult } from '../services/VisionEngine';

interface VisionState {
  analysis: VisionAnalysisResult;
  analyzeScreen: () => void;
  executeCommand: (cmd: string) => void;
}

export const useVisionStore = create<VisionState>((set) => ({
  analysis: visionEngine.analyzeScreen(),

  analyzeScreen: () => {
    const result = visionEngine.analyzeScreen();
    set({ analysis: result });
  },

  executeCommand: (cmd) => {
    const result = visionEngine.executeVisionCommand(cmd);
    set({ analysis: result });
  },
}));
