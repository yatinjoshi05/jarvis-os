import { UploadEngine } from '../upload-engine/UploadEngine.js';
import { AgentCommunication } from './AgentCommunication.js';

export class PublisherAgent {
  static agentName = 'PublisherAgent';

  static async scheduleUpload(storyId, channelId, publishTime) {
    return UploadEngine.scheduleUpload(storyId, channelId, publishTime);
  }

  static async publishVideo(storyId, channelId) {
    const res = await UploadEngine.uploadVideo(storyId, channelId);
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'AnalyticsAgent',
      message: `Published video ${res.youtubeVideoId} on YouTube. Initiated retention & analytics tracking.`,
      payload: { youtubeVideoId: res.youtubeVideoId, url: res.url }
    });
    return res;
  }

  static async retryUpload(storyId, channelId) {
    return this.publishVideo(storyId, channelId);
  }

  static verifyPublication(youtubeVideoId) {
    return { youtubeVideoId, published: true, liveStatus: 'Public' };
  }
}
