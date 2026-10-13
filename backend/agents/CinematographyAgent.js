import { AgentCommunication } from './AgentCommunication.js';

export class CinematographyAgent {
  static agentName = 'CinematographyAgent';

  static chooseCamera(emotion = 'sad') {
    const emotionLower = emotion.toLowerCase();
    if (emotionLower.includes('sad') || emotionLower.includes('emotional')) {
      return { angle: 'Slow zoom-in close-up shot', lens: '85mm f/1.4 Portrait Lens', framing: 'Vertical 9:16 Centered' };
    }
    if (emotionLower.includes('flood') || emotionLower.includes('disaster')) {
      return { angle: 'Cinematic wide dramatic pan shot', lens: '24mm Wide Angle Lens', framing: 'Vertical High-Angle' };
    }
    return { angle: 'Medium close-up tracking shot', lens: '50mm Prime Lens', framing: 'Vertical 9:16' };
  }

  static chooseLighting(emotion = 'sad') {
    const emotionLower = emotion.toLowerCase();
    if (emotionLower.includes('sad')) return 'Moody golden hour diffused backlight with soft key light';
    if (emotionLower.includes('flood')) return 'Overcast stormy dramatic contrast lighting';
    if (emotionLower.includes('horror')) return 'Low-key dark atmospheric moonlight with heavy shadows';
    return 'Bright warm natural sunlight';
  }

  static generateShots(scenes = []) {
    const shots = scenes.map((s, idx) => ({
      shotNumber: idx + 1,
      camera: this.chooseCamera(s.emotion || 'sad'),
      lighting: this.chooseLighting(s.emotion || 'sad'),
      composition: `Cinematic 1080x1920 shot #${idx + 1}`
    }));

    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'VoiceAgent',
      message: `Generated ${shots.length} camera & shot compositions. Ready for audio synthesis.`,
      payload: { shotsCount: shots.length }
    });

    return shots;
  }

  static createTransitions() {
    return ['Film Grain Dissolve', 'Cross Blur Fade', 'Luma Wipe', 'Soft Match Cut'];
  }
}
