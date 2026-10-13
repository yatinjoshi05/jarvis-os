# JARVIS OS — Voice Architecture Blueprint (`/voice`)

## Overview
The Voice Engine architecture processes real-time microphone audio input, performs wake-word detection, transcribes speech to text, manages conversational AI interaction states, and streams synthesized speech back to the user with audio reactivity.

## Audio Processing Pipeline

```mermaid
graph TD
    Mic[Microphone Hardware] --> MicMgr[MicrophoneManager / SpeechRecognitionController]
    MicMgr --> Analyser[Web Audio Analyser / useAudioAnalyser]
    MicMgr --> WakeWord[WakeWordEngine]

    WakeWord -- Match "Hey JARVIS" --> AudioFSM[AudioStateMachine State: LISTENING]
    Analyser --> Reactivity[SpeechAudioReactivity]
    Reactivity --> GlobeCanvas[AICore QuantumGlobeCanvas Spectrum Reactivity]

    MicMgr -- Audio Stream / Text --> STTEngine[SpeechRecognitionManager / Whisper API]
    STTEngine -- Transcribed Prompt --> VoiceCommandHandler[VoiceCommandHandler]
    VoiceCommandHandler --> AIRouter[AIRouter LLM Provider]

    AIRouter -- Response Text --> TTSEngine[TextToSpeechManager ElevenLabs / Browser TTS]
    TTSEngine --> SpeechQueue[SpeechQueue Chunk Buffer]
    SpeechQueue --> AudioPlayer[AudioPlayer / AudioMixer]
    AudioPlayer --> Speaker[Speaker Hardware Output]
```

## Key Services & Modules

### 1. `AudioStateMachine.ts`
- **Path**: [AudioStateMachine.ts](file:///d:/jarvis/apps/web/src/shared/audio/AudioStateMachine.ts)
- Finite state machine managing transition rules between `IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `MUTED`, `ERROR`.

### 2. `VoiceManager.ts` & `VoiceCommandHandler.ts`
- **Path**: [VoiceManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/VoiceManager.ts)
- High-level coordinator bridging UI microphone controls with AI provider selection and TTS playback.

### 3. `SpeechRecognitionManager.ts` & `TextToSpeechManager.ts`
- **Paths**: [SpeechRecognitionManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/SpeechRecognitionManager.ts), [TextToSpeechManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/TextToSpeechManager.ts)
- Driver classes handling dual-mode WebSpeech API and REST/WebSocket API backends (ElevenLabs, OpenAI Whisper, Ollama).
