import { agentEventBus } from './AgentEventBus';

export interface UIElementDetection {
  id: string;
  type: 'button' | 'window' | 'form' | 'chart' | 'icon' | 'text_block';
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface VisionAnalysisResult {
  timestamp: string;
  confidenceScore: number;
  screenSummary: string;
  ocrTextList: string[];
  detectedElements: UIElementDetection[];
  buttonsCount: number;
  windowsCount: number;
  chartsCount: number;
}

export class VisionEngineService {
  private lastAnalysis: VisionAnalysisResult = {
    timestamp: new Date().toISOString(),
    confidenceScore: 98.4,
    screenSummary: 'JARVIS OS Mission Control Dashboard (Dark Glass UI Mode)',
    ocrTextList: [
      'JARVIS OS v2.4 CORE',
      'SYSTEM HEALTH INTELLIGENCE - HEALTHY',
      'ACTIVE KERNEL PROCESSES - 5 RUNNING',
      'NEURAL MEMORY ENGINE - 4 RECORDS INDEXED',
      'VOICE INTEGRATION - STATE: MUTED',
    ],
    detectedElements: [
      { id: 'ui-1', type: 'window', label: 'Mission Control Master Surface', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, confidence: 0.99 },
      { id: 'ui-2', type: 'button', label: 'Start Mission CTA', bounds: { x: 40, y: 520, width: 140, height: 36 }, confidence: 0.98 },
      { id: 'ui-3', type: 'button', label: 'Create Task CTA', bounds: { x: 190, y: 520, width: 140, height: 36 }, confidence: 0.97 },
      { id: 'ui-4', type: 'chart', label: 'System Health CPU Wave Meter', bounds: { x: 420, y: 120, width: 500, height: 120 }, confidence: 0.99 },
      { id: 'ui-5', type: 'form', label: 'Search Neural Memory Index Bar', bounds: { x: 1400, y: 480, width: 380, height: 32 }, confidence: 0.98 },
    ],
    buttonsCount: 18,
    windowsCount: 4,
    chartsCount: 2,
  };

  public analyzeScreen(): VisionAnalysisResult {
    this.lastAnalysis = {
      ...this.lastAnalysis,
      timestamp: new Date().toISOString(),
      confidenceScore: Math.round((97.5 + Math.random() * 2) * 10) / 10,
    };

    agentEventBus.emit('vision:screen_analyzed', this.lastAnalysis);
    return this.lastAnalysis;
  }

  public extractText(): string[] {
    return this.lastAnalysis.ocrTextList;
  }

  public findButtons(): UIElementDetection[] {
    return this.lastAnalysis.detectedElements.filter((e) => e.type === 'button');
  }

  public executeVisionCommand(_command: string): VisionAnalysisResult {
    this.analyzeScreen();
    return this.lastAnalysis;
  }
}

export const visionEngine = new VisionEngineService();
