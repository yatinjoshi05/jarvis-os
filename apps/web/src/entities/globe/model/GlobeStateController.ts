import { GlobeState, GlobeQuality } from '../types/globe.types'

export type GlobeStateSubscriber = (state: GlobeState) => void
export type GlobeAudioSubscriber = (amplitude: number) => void

export class GlobeStateController {
  private currentState: GlobeState = 'idle'
  private currentQuality: GlobeQuality = 'ultra'
  private isPaused: boolean = false
  private audioAmplitude: number = 0
  private targetAudioAmplitude: number = 0

  private stateSubscribers: Set<GlobeStateSubscriber> = new Set()
  private audioSubscribers: Set<GlobeAudioSubscriber> = new Set()

  public getState(): GlobeState {
    return this.currentState
  }

  public setState(newState: GlobeState): void {
    if (this.currentState === newState) return
    this.currentState = newState
    this.stateSubscribers.forEach((sub) => sub(newState))
  }

  public getQuality(): GlobeQuality {
    return this.currentQuality
  }

  public setQuality(quality: GlobeQuality): void {
    this.currentQuality = quality
  }

  public getAudioAmplitude(): number {
    return this.audioAmplitude
  }

  public setAudioAmplitude(value: number): void {
    this.targetAudioAmplitude = Math.max(0, Math.min(1, value))
    // Smooth lerp update
    this.audioAmplitude += (this.targetAudioAmplitude - this.audioAmplitude) * 0.2
    this.audioSubscribers.forEach((sub) => sub(this.audioAmplitude))
  }

  public pause(): void {
    this.isPaused = true
  }

  public resume(): void {
    this.isPaused = false
  }

  public getIsPaused(): boolean {
    return this.isPaused
  }

  public subscribeState(callback: GlobeStateSubscriber): () => void {
    this.stateSubscribers.add(callback)
    return () => this.stateSubscribers.delete(callback)
  }

  public subscribeAudio(callback: GlobeAudioSubscriber): () => void {
    this.audioSubscribers.add(callback)
    return () => this.audioSubscribers.delete(callback)
  }
}

export const globeStateController = new GlobeStateController()
