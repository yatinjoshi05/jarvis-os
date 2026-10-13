import { voiceManager } from '../ai/VoiceManager'
import { eventBus } from '../../entities/mission/model/eventBus'
import { missionOrchestrator } from '../../entities/mission/orchestrator/MissionOrchestrator'
import { useMissionStore } from '../../entities/mission/model/useMissionStore'

class VoiceEngine {
  private isListeningForWakeWord = false

  public initializeVoiceSystem(): void {
    console.log('[VoiceEngine] Initializing Voice Assistant & Wake Word listener...')
    this.isListeningForWakeWord = true
  }

  public async processVoiceCommand(transcription: string): Promise<void> {
    console.log(`[VoiceEngine] Voice Command Transcribed: "${transcription}"`)

    const store = useMissionStore.getState()
    const activeMission = store.activeMission
    const missionId = activeMission?.id || `m-voice-${Date.now()}`

    eventBus.publish('REASONING_STREAM', missionId, {
      text: `\n[Voice Assistant] Voice Command Received: "${transcription}". Dispatching to Mission Orchestrator...`,
    })

    // Speak response confirmation via TextToSpeech
    voiceManager.speak(`Executing voice mission: ${transcription.slice(0, 30)}`)

    // Dispatch voice command to Mission Orchestrator
    await missionOrchestrator.executeMission(missionId, transcription)
  }

  public isListening(): boolean {
    return this.isListeningForWakeWord
  }

  public stop(): void {
    this.isListeningForWakeWord = false
    voiceManager.stopSpeaking()
  }
}

export const voiceEngine = new VoiceEngine()
