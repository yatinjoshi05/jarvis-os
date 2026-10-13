/**
 * AudioMixer.ts
 * Multi-channel audio mixer supporting independent Ambient, UI, and Voice channels.
 * Features:
 * - Preloading of all ambient & UI assets on initialization.
 * - Dual-slot crossfading (Slot A & Slot B) between ambient tracks.
 * - Configurable fade durations (default 500ms).
 * - Simultaneous playback: Ambient speaking track plays underneath ElevenLabs voice.
 * - Non-overlapping UI sound effect playback pool.
 * - Event notification via audioEvents.
 */

import { AudioPlayer } from './AudioPlayer';
import { audioSettings } from './AudioSettings';
import { audioEvents } from './AudioEvents';
import { UiSoundType, SoundKey } from './AudioTypes';

function deriveSoundKey(src: string): SoundKey | null {
  if (!src) return null;
  if (src.includes('startup')) return 'startup';
  if (src.includes('idle')) return 'idle';
  if (src.includes('listening')) return 'listening';
  if (src.includes('thinking')) return 'thinking';
  if (src.includes('speaking')) return 'speaking';
  if (src.includes('shutdown')) return 'shutdown';
  if (src.includes('click')) return 'click';
  if (src.includes('typing')) return 'typing';
  if (src.includes('notification')) return 'notification';
  if (src.includes('success')) return 'success';
  if (src.includes('error')) return 'error';
  return null;
}

export class AudioMixer {
  private ambientPlayerA: AudioPlayer;
  private ambientPlayerB: AudioPlayer;
  private activeAmbientSlot: 'A' | 'B' = 'A';

  private uiPlayerPool: AudioPlayer[] = [];
  private poolSize = 4;
  private nextUiPlayerIndex = 0;

  private voiceVolumeMultiplier = 1.0;

  constructor() {
    this.ambientPlayerA = new AudioPlayer();
    this.ambientPlayerB = new AudioPlayer();

    for (let i = 0; i < this.poolSize; i++) {
      this.uiPlayerPool.push(new AudioPlayer());
    }

    // Subscribe to settings changes to recalculate volumes on active players
    audioSettings.subscribe(() => {
      this.syncActiveVolumes();
    });

    this.preloadAllAssets();
  }

  /**
   * Preload all MP3 files placed in public/assets/audio/
   */
  public async preloadAllAssets() {
    const ambientAssets = [
      '/assets/audio/ambient/startup.mp3',
      '/assets/audio/ambient/idle.mp3',
      '/assets/audio/ambient/listening.mp3',
      '/assets/audio/ambient/thinking.mp3',
      '/assets/audio/ambient/speaking.mp3',
      '/assets/audio/ambient/shutdown.mp3',
    ];

    const uiAssets = [
      '/assets/audio/ui/click.mp3',
      '/assets/audio/ui/notification.mp3',
      '/assets/audio/ui/success.mp3',
      '/assets/audio/ui/error.mp3',
    ];

    for (const src of ambientAssets) {
      await this.ambientPlayerA.preload(src);
    }
    for (const src of uiAssets) {
      await this.uiPlayerPool[0].preload(src);
    }
  }

  private getActiveAmbientPlayer(): AudioPlayer {
    return this.activeAmbientSlot === 'A' ? this.ambientPlayerA : this.ambientPlayerB;
  }

  private getInactiveAmbientPlayer(): AudioPlayer {
    return this.activeAmbientSlot === 'A' ? this.ambientPlayerB : this.ambientPlayerA;
  }

  private syncActiveVolumes() {
    const activePlayer = this.getActiveAmbientPlayer();
    if (activePlayer.isPlaying && activePlayer.src) {
      const soundKey = deriveSoundKey(activePlayer.src);
      const targetVol = soundKey ? audioSettings.getEffectiveSoundVolume(soundKey) : audioSettings.getEffectiveVolume('ambient');
      activePlayer.setVolume(targetVol);
    }
  }

  /**
   * Crossfade from current ambient track to a new ambient track.
   * Default fade duration is 500ms (configurable in AudioSettings).
   */
  public async playAmbient(src: string, loop = true): Promise<boolean> {
    const activePlayer = this.getActiveAmbientPlayer();
    const soundKey = deriveSoundKey(src);
    const targetVol = soundKey ? audioSettings.getEffectiveSoundVolume(soundKey) : audioSettings.getEffectiveVolume('ambient');

    // If already playing this track, update volume and loop setting and return
    if (activePlayer.isPlaying && activePlayer.src === src) {
      activePlayer.setVolume(targetVol);
      return true;
    }

    const nextPlayer = this.getInactiveAmbientPlayer();
    const fadeMs = audioSettings.getState().fadeDurationMs || 500;

    // Start fading out current active player asynchronously
    if (activePlayer.isPlaying) {
      activePlayer.fadeOut(fadeMs).then(() => activePlayer.stop());
    }

    // Switch active slot
    this.activeAmbientSlot = this.activeAmbientSlot === 'A' ? 'B' : 'A';

    // Play next track on new slot with fade-in
    return nextPlayer.play(src, {
      loop,
      targetVolume: targetVol,
      fadeDurationMs: fadeMs,
    });
  }

  /**
   * Fade out and stop ambient playback.
   */
  public async stopAmbient(fadeMs?: number): Promise<void> {
    const duration = fadeMs ?? (audioSettings.getState().fadeDurationMs || 500);
    const playerA = this.ambientPlayerA;
    const playerB = this.ambientPlayerB;

    const promises: Promise<void>[] = [];
    if (playerA.isPlaying) promises.push(playerA.fadeOut(duration));
    if (playerB.isPlaying) promises.push(playerB.fadeOut(duration));

    await Promise.all(promises);
    playerA.stop();
    playerB.stop();
  }

  /**
   * Play a UI sound effect on the UI channel using player pool.
   * Audio assets are strictly resolved under /assets/audio/ui/
   */
  public async playUiSound(soundType: UiSoundType): Promise<boolean> {
    const targetVol = audioSettings.getEffectiveSoundVolume(soundType as SoundKey);
    if (targetVol <= 0) return false;

    const player = this.uiPlayerPool[this.nextUiPlayerIndex];
    this.nextUiPlayerIndex = (this.nextUiPlayerIndex + 1) % this.poolSize;

    const src = `/assets/audio/ui/${soundType}.mp3`;
    const fadeMs = soundType === 'typing' ? 50 : 100;

    audioEvents.emit('soundPlayed', { type: soundType, channel: 'ui' });

    return player.play(src, {
      loop: false,
      targetVolume: targetVol,
      fadeDurationMs: fadeMs,
    });
  }

  /**
   * Voice channel effective volume facade.
   */
  public getEffectiveVoiceVolume(): number {
    return audioSettings.getEffectiveVolume('voice') * this.voiceVolumeMultiplier;
  }

  public setVoiceVolumeMultiplier(multiplier: number) {
    this.voiceVolumeMultiplier = Math.max(0, Math.min(1, multiplier));
  }

  public dispose() {
    this.ambientPlayerA.dispose();
    this.ambientPlayerB.dispose();
    this.uiPlayerPool.forEach((p) => p.dispose());
  }
}

export const audioMixer = new AudioMixer();
export default audioMixer;
