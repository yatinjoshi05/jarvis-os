import { useEffect } from 'react'

import { assistantState } from './AssistantState'
import { speechRecognitionManager } from './SpeechRecognitionManager'
import { aiResponseManager } from './AIResponseManager'
import { voiceStateMachine } from './VoiceStateMachine'
import { VOICE_CONFIG } from './config'
import { voiceManager } from './VoiceManager'

/**
 * SpeechRecognitionController — mounts once inside NeuralGlobe's Canvas.
 *
 * Responsibilities:
 *  1. Passive wake-word detection (IDLE state)
 *  2. Active transcript capture (LISTENING state)
 *  3. Stopping mic during THINKING / SPEAKING to prevent echo
 *  4. Restarting mic when JARVIS returns to IDLE
 */
export default function SpeechRecognitionController() {
  useEffect(() => {
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null

    // ── State machine listener ──────────────────────────────────
    // Stop mic while JARVIS is thinking or speaking.
    // Restart mic ONLY when JARVIS returns to IDLE.
    const unsubscribeState = voiceStateMachine.subscribe((state) => {
      if (state === 'THINKING' || state === 'STREAMING' || state === 'SPEAKING' || state === 'GENERATING') {
        // Stop mic to prevent echo capture
        if (silenceTimeout) {
          clearTimeout(silenceTimeout)
          silenceTimeout = null
        }
        speechRecognitionManager.stop()
      } else if (state === 'IDLE') {
        // JARVIS is idle — restart passive listening (with a small delay so
        // any speech synthesis audio has time to decay)
        setTimeout(() => {
          if (
            voiceStateMachine.state === 'IDLE' &&
            !speechRecognitionManager.listening &&
            !speechRecognitionManager.isStarting
          ) {
            speechRecognitionManager.start()
          }
        }, 600)
      }
    })

    // ── Speech recognition listener ─────────────────────────────
    const handleCommand = async () => {
      // Guard: if state is already THINKING or TRANSCRIBING (e.g. from manual submit), abort
      if (voiceStateMachine.state !== 'LISTENING' && voiceStateMachine.state !== 'IDLE') {
        if (silenceTimeout) {
          clearTimeout(silenceTimeout)
          silenceTimeout = null
        }
        return
      }

      if (silenceTimeout) {
        clearTimeout(silenceTimeout)
        silenceTimeout = null
      }
      // Stop recognition before sending to Gemini
      speechRecognitionManager.stop()
      // Transition to TRANSCRIBING (not IDLE!) so state machine is correct
      // before respond() takes over
      voiceStateMachine.transitionTo('TRANSCRIBING')
      await aiResponseManager.respond()
    }

    const unsubscribeSpeech = speechRecognitionManager.subscribe((event) => {
      if (event.type === 'result') {
        const transcript = (event.transcript || '').trim()

        if (assistantState.state === 'LISTENING') {
          // ── Active command capture ─────────────────────────────
          assistantState.updateTranscript(transcript)

          // Silence detection: submit after silenceTimeoutMs of no new words
          if (silenceTimeout) clearTimeout(silenceTimeout)
          silenceTimeout = setTimeout(handleCommand, VOICE_CONFIG.silenceTimeoutMs)

        } else if (assistantState.state === 'IDLE') {
          // ── Passive wake word detection ────────────────────────
          const lower = transcript.toLowerCase()
          if (lower.includes('hey jarvis') || lower.includes('jarvis')) {
            speechRecognitionManager.stop()
            speechRecognitionManager.clear()

            // Extract the command part after the wake word
            const command = lower
              .replace('hey jarvis', '')
              .replace('jarvis', '')
              .trim()

            if (command) {
              // Wake word included an inline command (e.g. "Hey JARVIS what time is it")
              assistantState.updateTranscript(command)
              voiceStateMachine.transitionTo('TRANSCRIBING')
              aiResponseManager.respond()
            } else {
              // Wake word only — switch to active listening mode
              voiceManager.startListening()
            }
          }
        }

      } else if (event.type === 'error') {
        const errCode = (event.error as any)?.error
        // 'no-speech' is expected during silence — not a real error
        if (errCode !== 'no-speech' && errCode !== 'aborted') {
          console.warn('[JARVIS SpeechRecognition] Error:', event.error)
        }
      }
    })

    // ── Initial start ───────────────────────────────────────────
    const state = voiceStateMachine.state
    if (state === 'IDLE' || state === 'LISTENING') {
      if (!speechRecognitionManager.listening && !speechRecognitionManager.isStarting) {
        speechRecognitionManager.start()
      }
    }

    return () => {
      if (silenceTimeout) clearTimeout(silenceTimeout)
      unsubscribeState()
      unsubscribeSpeech()
      speechRecognitionManager.stop()
    }
  }, [])

  return null
}
