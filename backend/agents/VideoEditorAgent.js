import { VideoFactory } from '../video-factory/VideoFactory.js';
import { AgentCommunication } from './AgentCommunication.js';

export class VideoEditorAgent {
  static agentName = 'VideoEditorAgent';

  static async editVideo(storyData) {
    const res = await VideoFactory.renderVideo(storyData);
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'QualityControlAgent',
      message: `Rendered video ${res.renderResult.outputFile}. Ready for quality control inspection.`,
      payload: { outputFile: res.renderResult.outputFile }
    });
    return res;
  }

  static generateCaptions(scenes, duration) {
    return VideoFactory.generateCaptions(scenes, duration);
  }

  static applyTransitions(scenes) {
    return scenes.map(s => ({ ...s, transitionApplied: 'Cross Dissolve 0.4s' }));
  }

  static renderTimeline(pipelineInput) {
    return VideoFactory.renderVideo(pipelineInput);
  }
}
