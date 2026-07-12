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
}

class VoiceSettingsManager {
  private data: VoiceSettingsData = {
    voice: localStorage.getItem('voice_setting_voice') || '',
    pitch: parseFloat(localStorage.getItem('voice_setting_pitch') || '1.0'),
    rate: parseFloat(localStorage.getItem('voice_setting_rate') || '0.95'),
    volume: parseFloat(localStorage.getItem('voice_setting_volume') || '1.0'),
    language: localStorage.getItem('voice_setting_language') || VOICE_CONFIG.recognition.lang,
    autoListen: localStorage.getItem('voice_setting_autolisten') !== 'false',
    autoInterrupt: localStorage.getItem('voice_setting_autointerrupt') !== 'false',
    ttsProvider: localStorage.getItem('voice_setting_ttsprovider') || VOICE_CONFIG.ttsProvider,
  };

  public get settings(): VoiceSettingsData {
    return this.data;
  }

  public update(updateData: Partial<VoiceSettingsData>) {
    this.data = { ...this.data, ...updateData };
    
    // Save to localStorage
    if (updateData.voice !== undefined) localStorage.setItem('voice_setting_voice', this.data.voice);
    if (updateData.pitch !== undefined) localStorage.setItem('voice_setting_pitch', this.data.pitch.toString());
    if (updateData.rate !== undefined) localStorage.setItem('voice_setting_rate', this.data.rate.toString());
    if (updateData.volume !== undefined) localStorage.setItem('voice_setting_volume', this.data.volume.toString());
    if (updateData.language !== undefined) localStorage.setItem('voice_setting_language', this.data.language);
    if (updateData.autoListen !== undefined) localStorage.setItem('voice_setting_autolisten', this.data.autoListen ? 'true' : 'false');
    if (updateData.autoInterrupt !== undefined) localStorage.setItem('voice_setting_autointerrupt', this.data.autoInterrupt ? 'true' : 'false');
    if (updateData.ttsProvider !== undefined) localStorage.setItem('voice_setting_ttsprovider', this.data.ttsProvider);
  }
}

export const voiceSettings = new VoiceSettingsManager();
export default voiceSettings;
