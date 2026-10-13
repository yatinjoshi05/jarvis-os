/**
 * VoiceService — Public API for Speech Recognition, ElevenLabs TTS & Audio Streaming
 */
export class VoiceService {
  /**
   * Synthesize Text-to-Speech audio stream via ElevenLabs
   */
  static async synthesizeSpeech(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured on the server.');
    if (!text || !text.trim()) throw new Error('Text prompt is required.');

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    console.log(`[VoiceService] Synthesizing audio via ElevenLabs voice=${voiceId}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!res.ok) throw new Error(`ElevenLabs returned HTTP ${res.status}`);
    return res;
  }
}
