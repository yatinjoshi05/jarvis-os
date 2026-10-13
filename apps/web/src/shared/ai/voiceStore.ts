/**
 * voiceStore.ts
 *
 * Zustand store that surfaces the JARVIS voice pipeline state to React components.
 * Wraps the existing services:
 *   - VoiceManager       (startListening / stopListening / interrupt)
 *   - TextToSpeechManager (speak / stop / pause / resume)
 *   - VoiceStateMachine   (current state subscription)
 *   - VoiceSettings       (volume / mute / language / voice ID)
 *   - WakeWordEngine      (wake-word detection)
 *   - ElevenLabsProvider  (backend TTS via /api/tts/elevenlabs)
 *
 * No new services are created here — only a thin reactive layer so any component
 * can read & drive voice state without prop-drilling.
 */

import { create } from 'zustand';
import { voiceManager } from '../ai/VoiceManager';
import { textToSpeechManager } from '../ai/TextToSpeechManager';
import { voiceStateMachine } from '../ai/VoiceStateMachine';
import { voiceSettings } from '../ai/VoiceSettings';
import { wakeWordEngine } from '../ai/WakeWordEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoiceUIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'offline';

export interface VoiceStoreState {
  // Reactive state
  state: VoiceUIState;
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  currentResponse: string;
  volume: number;
  muted: boolean;

  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  mute: () => void;
  unmute: () => void;
  interrupt: () => void;
  setVolume: (v: number) => void;
  setVoiceId: (id: string) => void;

  /** Internal — called by VoiceStateMachine subscription */
  _syncState: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useVoiceStore = create<VoiceStoreState>((set, get) => {
  // Map VoiceStateMachine states to the simpler UI states
  const mapState = (): VoiceUIState => {
    const s = voiceStateMachine.state;
    if (!navigator.onLine) return 'offline';
    switch (s) {
      case 'LISTENING':
        return 'listening';
      case 'THINKING':
      case 'TRANSCRIBING':
      case 'GENERATING':
      case 'STREAMING':
      case 'EXECUTING':
        return 'thinking';
      case 'SPEAKING':
        return 'speaking';
      default:
        return 'idle';
    }
  };

  // Subscribe to VoiceStateMachine so the store auto-updates
  voiceStateMachine.subscribe(() => {
    get()._syncState();
  });

  return {
    // ── Initial state ────────────────────────────────────────────────────
    state: mapState(),
    isListening: false,
    isSpeaking: false,
    currentTranscript: '',
    currentResponse: '',
    volume: voiceSettings.settings.volume,
    muted: false,

    // ── Internal sync ────────────────────────────────────────────────────
    _syncState: () => {
      const uiState = mapState();
      set({
        state: uiState,
        isListening: uiState === 'listening',
        isSpeaking: uiState === 'speaking',
      });
    },

    // ── Actions ──────────────────────────────────────────────────────────

    startListening: async () => {
      await voiceManager.startListening();
    },

    stopListening: () => {
      voiceManager.stopListening();
    },

    speak: async (text: string) => {
      if (!text.trim()) return;
      const queue = textToSpeechManager.startQueue();
      textToSpeechManager.addSentence(text, 'HIGH');
      textToSpeechManager.finishQueue();
      await queue;
    },

    pause: () => {
      // Pause current audio (ElevenLabsProvider exposes pause via the stop chain)
      textToSpeechManager.stop();
    },

    resume: () => {
      // Resume is handled automatically when the next sentence in queue plays
      console.log('[voiceStore] resume called — handled by queue.');
    },

    mute: () => {
      voiceSettings.update({ volume: 0 });
      set({ muted: true, volume: 0 });
    },

    unmute: () => {
      const restored = 1.0;
      voiceSettings.update({ volume: restored });
      set({ muted: false, volume: restored });
    },

    interrupt: () => {
      voiceManager.interrupt();
    },

    setVolume: (v: number) => {
      const clamped = Math.min(1, Math.max(0, v));
      voiceSettings.update({ volume: clamped });
      set({ volume: clamped, muted: clamped === 0 });
    },

    setVoiceId: (id: string) => {
      voiceSettings.update({ elevenlabsVoiceId: id });
    },
  };
});

// ── Singleton imperative accessor (for non-React consumers) ──────────────────

export const voiceStore = {
  getState: () => useVoiceStore.getState(),
  startListening: () => useVoiceStore.getState().startListening(),
  stopListening: () => useVoiceStore.getState().stopListening(),
  speak: (text: string) => useVoiceStore.getState().speak(text),
  pause: () => useVoiceStore.getState().pause(),
  resume: () => useVoiceStore.getState().resume(),
  mute: () => useVoiceStore.getState().mute(),
  unmute: () => useVoiceStore.getState().unmute(),
  interrupt: () => useVoiceStore.getState().interrupt(),
  setVolume: (v: number) => useVoiceStore.getState().setVolume(v),
  setVoiceId: (id: string) => useVoiceStore.getState().setVoiceId(id),

  /** Wake-word helpers */
  addWakeWord: (word: string) => wakeWordEngine.addCustomWakeWord(word),
  getWakeWords: () => wakeWordEngine.getWakeWords(),
};
