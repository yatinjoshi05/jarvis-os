import { QualityController } from './QualityController.js';
import { AgentCommunication } from './AgentCommunication.js';

export class QualityControlAgent {
  static agentName = 'QualityControlAgent';

  static verifyAudio(audioQuality = 92.0) {
    return { passed: audioQuality >= 85.0, score: audioQuality };
  }

  static verifyVideo(resolution = '1080x1920', fps = 30) {
    return { passed: resolution === '1080x1920' && fps === 30, resolution, fps };
  }

  static verifyCharacters(consistencyScore = 95.0) {
    return { passed: consistencyScore >= 90.0, score: consistencyScore };
  }

  static verifyCaptions(captionsCount = 5) {
    return { passed: captionsCount > 0, count: captionsCount };
  }

  static approveVideo(qualityInput) {
    const inspection = QualityController.inspectVideoQuality(qualityInput);

    AgentCommunication.sendMessage({
      from: this.agentName,
      to: inspection.approved ? 'PublisherAgent' : 'ProducerAgent',
      message: inspection.approved
        ? `✓ QC Approved! Video passed consistency (${qualityInput.consistencyScore}%), audio (${qualityInput.audioQuality}%), and viral score (${qualityInput.viralScore}).`
        : `✗ QC Rejected! Reasons: ${inspection.rejections.join('; ')}`,
      payload: inspection
    });

    return inspection;
  }
}
