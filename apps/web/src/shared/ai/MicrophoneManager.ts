export type MicrophoneState =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'denied'

class MicrophoneManager {
  private stream: MediaStream | null = null

  private audioContext: AudioContext | null = null

  private analyser: AnalyserNode | null = null

  private source: MediaStreamAudioSourceNode | null = null

  private dataArray: Uint8Array<ArrayBuffer> | null = null

  public state: MicrophoneState = 'idle'

  public voiceLevel = 0

  async requestPermission() {
    if (this.stream) return true

    try {
      this.state = 'requesting'

      this.stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

      this.audioContext = new AudioContext()

      this.source =
        this.audioContext.createMediaStreamSource(
          this.stream
        )

      this.analyser =
        this.audioContext.createAnalyser()

      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.85

      this.dataArray = new Uint8Array<ArrayBuffer>(
        new ArrayBuffer(
          this.analyser.frequencyBinCount
        )
      )

      this.source.connect(this.analyser)

      this.state = 'listening'

      return true
    } catch (error) {
      console.error(error)

      this.state = 'denied'

      return false
    }
  }

  update() {
    if (!this.analyser || !this.dataArray) {
      this.voiceLevel = 0
      return
    }

    this.analyser.getByteTimeDomainData(
      this.dataArray
    )

    let sum = 0

    for (
      let i = 0;
      i < this.dataArray.length;
      i++
    ) {
      const value =
        (this.dataArray[i] - 128) / 128

      sum += value * value
    }

    const rms = Math.sqrt(
      sum / this.dataArray.length
    )

    this.voiceLevel +=
      (rms - this.voiceLevel) * 0.25
  }

  stop() {
    this.stream?.getTracks().forEach((track) =>
      track.stop()
    )

    this.audioContext?.close()

    this.stream = null
    this.audioContext = null
    this.analyser = null
    this.source = null
    this.dataArray = null

    this.voiceLevel = 0

    this.state = 'idle'
  }
}

export const microphoneManager =
  new MicrophoneManager()