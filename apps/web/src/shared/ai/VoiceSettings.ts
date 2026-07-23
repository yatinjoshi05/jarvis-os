import { VOICE_CONFIG } from './config';

export interface VoiceSettingsData {
  voice: string;
  pitch: number;
  rate: number;
  volume: number;
  language: string;
  autoListen: boolean;
  autoInterrupt: boolean;
  ttsProvider: string;
  /** ElevenLabs voice ID (e.g. 'pNInz6obpgDQGcFmaJgB'). Stored separately from the
   *  browser `voice` name so ElevenLabsProvider can read the correct ID at runtime. */
  elevenlabsVoiceId: string;
}

function safeGetItem(key: string, fallback: string = ''): string {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
}

function resolveInitialTTSProvider(): string {
  const envProvider = VOICE_CONFIG.ttsProvider;
  if (typeof localStorage !== 'undefined') {
    try {
      const legacyKeyVal = localStorage.getItem('voice_setting_ttsProvider');
      if (legacyKeyVal) {
        localStorage.removeItem('voice_setting_ttsProvider');
      }
      const stored = localStorage.getItem('voice_setting_ttsprovider') || legacyKeyVal;
      if (stored && stored !== 'browser') {
        return stored;
      }
      if (envProvider) {
        return envProvider;
      }
      return stored || 'browser';
    } catch (_) {}
  }
  return envProvider || 'browser';
}

class VoiceSettingsManager {
  private data: VoiceSettingsData = {
    voice: safeGetItem('voice_setting_voice', ''),
    pitch: parseFloat(safeGetItem('voice_setting_pitch', '1.0')),
    rate: parseFloat(safeGetItem('voice_setting_rate', '0.95')),
    volume: parseFloat(safeGetItem('voice_setting_volume', '1.0')),
    language: safeGetItem('voice_setting_language', VOICE_CONFIG.recognition.lang),
    autoListen: safeGetItem('voice_setting_autolisten', 'true') !== 'false',
    autoInterrupt: safeGetItem('voice_setting_autointerrupt', 'false') === 'true',
    ttsProvider: resolveInitialTTSProvider(),
    // Prefer localStorage-saved voice ID, then .env default, then built-in fallback
    elevenlabsVoiceId: safeGetItem(
      'voice_setting_elevenlabs_voice_id',
      VOICE_CONFIG.elevenlabs.voiceId || 'pNInz6obpgDQGcFmaJgB'
    ),
  };

  public get settings(): VoiceSettingsData {
    return this.data;
  }

  public update(updateData: Partial<VoiceSettingsData>) {
    this.data = { ...this.data, ...updateData };
    
    // Save to localStorage safely
    if (typeof localStorage !== 'undefined') {
      try {
        if (updateData.voice !== undefined) localStorage.setItem('voice_setting_voice', this.data.voice);
        if (updateData.pitch !== undefined) localStorage.setItem('voice_setting_pitch', this.data.pitch.toString());
        if (updateData.rate !== undefined) localStorage.setItem('voice_setting_rate', this.data.rate.toString());
        if (updateData.volume !== undefined) localStorage.setItem('voice_setting_volume', this.data.volume.toString());
        if (updateData.language !== undefined) localStorage.setItem('voice_setting_language', this.data.language);
        if (updateData.autoListen !== undefined) localStorage.setItem('voice_setting_autolisten', this.data.autoListen ? 'true' : 'false');
        if (updateData.autoInterrupt !== undefined) localStorage.setItem('voice_setting_autointerrupt', this.data.autoInterrupt ? 'true' : 'false');
        if (updateData.ttsProvider !== undefined) localStorage.setItem('voice_setting_ttsprovider', this.data.ttsProvider);
        if (updateData.elevenlabsVoiceId !== undefined) localStorage.setItem('voice_setting_elevenlabs_voice_id', this.data.elevenlabsVoiceId);
      } catch (_) {}
    }
  }
}

export const voiceSettings = new VoiceSettingsManager();
export default voiceSettings;
