# JARVIS OS — Voice Memory (`/voice`)

## Project Purpose
The Voice module manages real-time wake word detection, continuous speech-to-text (STT), low-latency text-to-speech (TTS) audio streaming, audio visualization, state machine control, and voice command intent parsing across JARVIS OS.

## UI Architecture
- `AudioDebugPanel`: Developer telemetry panel for monitoring audio decibels, analyser frequencies, and state transitions.
- `MicrophoneController` / `SpeechRecognitionController`: Visual mic toggle buttons and audio level indicators.
- Shared audio reactivity hooks: `useAudioAnalyser`, `SpeechAudioReactivity`.

## Services
- `AudioStateMachine`: Finite State Machine (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `MUTED`, `ERROR`).
- `VoiceManager`: High-level voice coordinator (`apps/web/src/shared/ai/VoiceManager.ts`).
- `SpeechRecognitionManager`: WebSpeech API & Whisper backend recognition driver.
- `TextToSpeechManager`: ElevenLabs API & browser SpeechSynthesis voice engine.
- `WakeWordEngine`: Audio pattern watcher for wake-word activation ("Hey JARVIS").
- Backend Voice Service (`services/backend/src/services/VoiceService.js`).

## Stores
- `voiceStore`: Holds mic status, volume thresholds, selected voice ID, speech rate, active state.
- `AudioSettings`: Hydrates audio hardware preferences and audio device IDs.

## Routes
- Handled globally across all routes (`/home`, `/voice`, etc.) via `VoiceManager` and background audio state machine.

## Data Flow
1. Mic input captured by `MicrophoneManager` -> audio samples analyzed by `useAudioAnalyser`.
2. Speech detected or wake word matched -> `AudioStateMachine` transitions to `LISTENING`.
3. STT transcribes audio -> sends text to `VoiceCommandHandler` / `AIRouter`.
4. AI generates response -> `TextToSpeechManager` synthesizes audio chunk queue (`SpeechQueue`).
5. `AudioPlayer` streams audio output while `AICore` globe animates in sync with audio frequency bands.

## Dependencies
- Audio libraries: Web Audio API, Web Speech API, ElevenLabs API, Web Audio Analyser.
- Files: [AudioStateMachine.ts](file:///d:/jarvis/apps/web/src/shared/audio/AudioStateMachine.ts), [VoiceManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/VoiceManager.ts), [TextToSpeechManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/TextToSpeechManager.ts), [SpeechRecognitionManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/SpeechRecognitionManager.ts).

## Frozen Components
- Voice indicators in `AICore` on the Home page must reflect state transitions faithfully without shifting layout geometry.

## Important Files
- [AudioStateMachine.ts](file:///d:/jarvis/apps/web/src/shared/audio/AudioStateMachine.ts)
- [VoiceManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/VoiceManager.ts)
- [voiceEngine.ts](file:///d:/jarvis/apps/web/src/shared/voice/voiceEngine.ts)

## Warnings
- Always check mic permissions before initializing audio contexts to avoid browser auto-play policy blocks.

## Future Plans
- Local offline Whisper & Piper TTS model support via WebAssembly / ONNX.

## Known Issues
- Browser WebSpeech API requires fallback to backend Whisper model when running inside desktop webview on certain OS platforms.
