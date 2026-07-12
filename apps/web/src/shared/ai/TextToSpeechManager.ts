import { voiceStateMachine } from './VoiceStateMachine'
import { assistantState } from './AssistantState'
import { captionManager } from './CaptionManager'

// Safety timeout: if speech doesn't start within this window, fall back to caption-only
const SPEECH_START_TIMEOUT_MS = 900

class TextToSpeechManager {
  private queue: string[] = []
  private isGenerating = false  // true while Gemini is still streaming
  private currentIndex = 0
  private isProcessing = false  // true while a sentence is being spoken
  private cancelled = false

  // Promise that resolves when the entire queue finishes
  private queueResolve?: () => void

  // ─── Public API ───────────────────────────────────────────────

  /**
   * Opens a new queue. Returns a promise that resolves when all sentences
   * have been spoken (or cancelled). Always call cancel() first if reusing.
   */
  startQueue(): Promise<void> {
    this.resetState()
    this.isGenerating = true

    return new Promise<void>((resolve) => {
      this.queueResolve = resolve
    })
  }

  /** Push a new sentence while streaming. Safe to call concurrently. */
  addSentence(sentence: string) {
    if (this.cancelled) return
    const trimmed = sentence.trim()
    if (!trimmed) return
    this.queue.push(trimmed)
    this.processNext()
  }

  /** Signal that no more sentences are coming from Gemini. */
  finishQueue() {
    this.isGenerating = false
    // In case the queue was already empty when finishQueue was called
    this.checkIfDone()
  }

  /** Cancel all speech immediately. Resolves the queue promise so callers don't deadlock. */
  cancel() {
    this.cancelled = true
    this.isProcessing = false

    // Stop browser speech
    try {
      window.speechSynthesis.cancel()
    } catch (_) { /* ignore */ }

    // Stop caption timer without calling onComplete (no stale UI updates)
    captionManager.stop()

    // Resolve the queue promise so AIResponseManager's `await speakPromise` unblocks
    this.queueResolve?.()
    this.queueResolve = undefined
  }

  /** Stop speech and transition state machine to IDLE. */
  stop() {
    this.cancel()
    voiceStateMachine.transitionTo('IDLE')
  }

  // ─── Internal ─────────────────────────────────────────────────

  private resetState() {
    // Cancel any active speech first
    this.cancel()
    this.cancelled = false
    this.queue = []
    this.currentIndex = 0
    this.isProcessing = false
    this.isGenerating = false
    this.queueResolve = undefined
  }

  /** Non-recursive queue driver. Called after each sentence finishes. */
  private processNext() {
    // Guard: don't start if already processing or cancelled
    if (this.isProcessing || this.cancelled) return

    // Nothing left to process right now
    if (this.currentIndex >= this.queue.length) {
      this.checkIfDone()
      return
    }

    this.isProcessing = true
    const sentence = this.queue[this.currentIndex]
    this.currentIndex++

    this.speakSentence(sentence).then(() => {
      this.isProcessing = false
      if (!this.cancelled) {
        this.processNext()
      }
    })
  }

  private checkIfDone() {
    if (!this.isGenerating && this.currentIndex >= this.queue.length && !this.isProcessing) {
      this.queueResolve?.()
      this.queueResolve = undefined
    }
  }

  private speakSentence(sentence: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!sentence.trim() || this.cancelled) {
        resolve()
        return
      }

      let resolved = false
      let startTimeoutId: ReturnType<typeof setTimeout> | null = null
      let endTimeoutId: ReturnType<typeof setTimeout> | null = null

      // Single resolve guard — prevents double-resolve
      const finish = () => {
        if (resolved) return
        resolved = true
        if (startTimeoutId) {
          clearTimeout(startTimeoutId)
          startTimeoutId = null
        }
        if (endTimeoutId) {
          clearTimeout(endTimeoutId)
          endTimeoutId = null
        }
        resolve()
      }

      // ── Caption setup ──────────────────────────────────────────
      // Caption completes independently of audio — so captions always show
      // even if speech is blocked (autoplay policy, TTS error, etc.)
      captionManager.start(
        sentence,
        (cap) => assistantState.setCaption(cap),
        () => {
          // Caption finished naturally — audio may still be playing, that's fine
          // We only finish the sentence promise when audio is done too
        }
      )

      // ── Utterance ──────────────────────────────────────────────
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = 'en-IN'
      utterance.rate = 0.95
      utterance.pitch = 1.0

      utterance.onstart = () => {
        if (startTimeoutId) {
          clearTimeout(startTimeoutId)
          startTimeoutId = null
        }
        
        // Safety timeout for 'onend' dropping
        const words = sentence.split(/\s+/).filter(Boolean).length
        const maxDurationMs = (words * 400) + 2000
        endTimeoutId = setTimeout(() => {
          console.warn('[JARVIS TTS] End timeout (onend never fired). Resolving forcibly.')
          captionManager.markComplete()
          finish()
        }, maxDurationMs)

        console.log(`[JARVIS TTS] Speaking: "${sentence.substring(0, 40)}..."`)
        voiceStateMachine.transitionTo('SPEAKING')
      }

      // Word-boundary sync: drive caption directly from browser events when available
      utterance.onboundary = (event) => {
        if (event.name !== 'word') return
        const charIndex = event.charIndex
        const remaining = sentence.slice(charIndex)
        const nextSpace = remaining.search(/\s/)
        const wordLen = nextSpace === -1 ? remaining.length : nextSpace
        const textSoFar = sentence.slice(0, charIndex + wordLen)
        captionManager.updateDirect(textSoFar)
      }

      utterance.onend = () => {
        console.log(`[JARVIS TTS] Done: "${sentence.substring(0, 40)}..."`)
        captionManager.markComplete()
        finish()
      }

      utterance.onerror = (e) => {
        // 'interrupted' is expected when cancel() is called — not a real error
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[JARVIS TTS] Error:', e.error)
        }
        captionManager.markComplete()
        finish()
      }

      // Safety timeout: if onstart never fires (browser autoplay blocked), resolve anyway
      // so captions still display and the queue keeps moving
      startTimeoutId = setTimeout(() => {
        console.warn('[JARVIS TTS] Start timeout. Falling back to caption-only.')
        voiceStateMachine.transitionTo('SPEAKING')
        // Don't call finish() yet — let the caption timer run to completion
        // The caption's onComplete will NOT resolve this promise, so we watch
        // for caption timer completion via a secondary timeout
        const captionWords = sentence.split(/\s+/).filter(Boolean)
        const captionDuration = captionWords.length * 290 + 500
        setTimeout(finish, captionDuration)
      }, SPEECH_START_TIMEOUT_MS)

      try {
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.error('[JARVIS TTS] speak() threw:', e)
        captionManager.markComplete()
        finish()
      }
    })
  }
}

export const textToSpeechManager = new TextToSpeechManager()