/**
 * VoiceCommandHandler.ts
 *
 * Listens to final speech transcripts and routes built-in voice commands to the
 * correct JARVIS subsystem. This is wired into the existing SpeechRecognitionManager
 * event stream — no new recognition engine is created.
 *
 * Built-in commands:
 *   "hey jarvis [command]" / "jarvis [command]"  → wake-word + pass-through
 *   "stop"                                        → interrupt TTS
 *   "pause"                                       → pause TTS
 *   "continue" / "resume"                         → resume TTS
 *   "mute"                                        → mute voice
 *   "unmute"                                      → unmute voice
 *   "open browser"                                → navigate to /browser
 *   "open terminal"                               → navigate to /terminal
 *   "open missions"                               → navigate to /missions
 *   "open home"                                   → navigate to /
 *   "open mission control"                        → navigate to /mission-control
 *   "open memory"                                 → navigate to /memory
 *   "open files"                                  → navigate to /files
 *   "open chat"                                   → navigate to /chat
 */

import { speechRecognitionManager } from './SpeechRecognitionManager';
import { voiceStore } from './voiceStore';
import { wakeWordEngine } from './WakeWordEngine';

type NavigateFn = (path: string) => void;

const NAVIGATION_COMMANDS: Array<{ patterns: string[]; path: string }> = [
  { patterns: ['open browser'], path: '/browser' },
  { patterns: ['open terminal'], path: '/terminal' },
  { patterns: ['open missions', 'open mission'], path: '/missions' },
  { patterns: ['open home', 'go home'], path: '/' },
  { patterns: ['open mission control', 'mission control'], path: '/mission-control' },
  { patterns: ['open memory', 'memory'], path: '/memory' },
  { patterns: ['open files', 'files'], path: '/files' },
  { patterns: ['open chat', 'chat'], path: '/chat' },
  { patterns: ['open settings', 'settings'], path: '/settings' },
];

class VoiceCommandHandlerClass {
  private navigate: NavigateFn | null = null;
  private registered = false;

  /** Call once from the top-level Shell to inject the router navigate function. */
  public register(navigate: NavigateFn) {
    this.navigate = navigate;
    if (this.registered) return;
    this.registered = true;

    speechRecognitionManager.subscribe((event) => {
      if (event.type !== 'result' || !event.isFinal || !event.transcript) return;
      this.handleTranscript(event.transcript.trim().toLowerCase());
    });

    console.log('[VoiceCommandHandler] Registered. Listening for voice commands.');
  }

  private handleTranscript(raw: string) {
    // Strip wake word prefix to get the actual command
    const { matches, command } = wakeWordEngine.checkWakeWord(raw);
    const text = matches ? command : raw;
    if (!text) return;

    // 1. Stop / interrupt
    if (['stop', 'stop speaking', 'quiet', 'be quiet'].includes(text)) {
      voiceStore.interrupt();
      console.log('[VoiceCommand] Stop');
      return;
    }

    // 2. Pause
    if (['pause', 'pause speaking'].includes(text)) {
      voiceStore.pause();
      console.log('[VoiceCommand] Pause');
      return;
    }

    // 3. Resume / Continue
    if (['continue', 'resume', 'continue speaking'].includes(text)) {
      voiceStore.resume();
      console.log('[VoiceCommand] Resume');
      return;
    }

    // 4. Mute
    if (['mute', 'mute jarvis', 'silence'].includes(text)) {
      voiceStore.mute();
      console.log('[VoiceCommand] Mute');
      return;
    }

    // 5. Unmute
    if (['unmute', 'unmute jarvis', 'unmute voice'].includes(text)) {
      voiceStore.unmute();
      console.log('[VoiceCommand] Unmute');
      return;
    }

    // 6. Navigation commands
    for (const { patterns, path } of NAVIGATION_COMMANDS) {
      if (patterns.some((p) => text.includes(p))) {
        this.navigate?.(path);
        console.log(`[VoiceCommand] Navigate → ${path}`);
        return;
      }
    }
  }
}

export const voiceCommandHandler = new VoiceCommandHandlerClass();
