export type SpeechEvent = {
  type: 'start' | 'end' | 'error' | 'result'
  transcript?: string
  isFinal?: boolean
  error?: any
}

export type SpeechListener = (event: SpeechEvent) => void

class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null

  public transcript = ''

  public listening = false

  private listeners = new Set<SpeechListener>()

  public supported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window ||
      'SpeechRecognition' in window)

  constructor() {
    if (!this.supported) return

    const SpeechRecognitionClass =
      (
        window as typeof window & {
          webkitSpeechRecognition?: new () => SpeechRecognition
          SpeechRecognition?: new () => SpeechRecognition
        }
      ).webkitSpeechRecognition ||
      (
        window as typeof window & {
          SpeechRecognition?: new () => SpeechRecognition
        }
      ).SpeechRecognition

    if (!SpeechRecognitionClass) return

    this.recognition =
      new SpeechRecognitionClass()

    this.recognition.continuous = true

    this.recognition.interimResults = true

    this.recognition.lang = 'en-IN'

    this.recognition.onstart = () => {
      this.listening = true
      this.notify({ type: 'start' })
    }

    this.recognition.onend = () => {
      this.listening = false
      this.notify({ type: 'end' })
    }

    this.recognition.onerror = (e) => {
      this.listening = false
      this.notify({ type: 'error', error: e })
    }

    this.recognition.onresult = (
      event: SpeechRecognitionEvent
    ) => {
      let text = ''
      let isFinal = false

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        text +=
          event.results[i][0].transcript
        if (event.results[i].isFinal) {
          isFinal = true
        }
      }

      this.transcript = text
      this.notify({ type: 'result', transcript: text, isFinal })
    }
  }

  public subscribe(listener: SpeechListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(event: SpeechEvent) {
    this.listeners.forEach((listener) => listener(event))
  }

  start() {
    if (!this.recognition) return

    if (this.listening) return

    try {
      this.recognition.start()
    } catch (e) {
      console.warn('SpeechRecognition start error:', e)
    }
  }

  stop() {
    if (!this.recognition) return

    this.recognition.stop()
  }

  clear() {
    this.transcript = ''
  }
}

export const speechRecognitionManager =
  new SpeechRecognitionManager()