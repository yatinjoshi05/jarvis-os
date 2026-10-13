/** Interfaces: adapters must provide transcribe(audio, options) and synthesize(text, options). */
export class UnsupportedSpeechToTextProvider { async transcribe() { throw new Error('No speech-to-text provider configured.'); } }
export class UnsupportedTextToSpeechProvider { async synthesize() { throw new Error('No text-to-speech provider configured.'); } }
export class EnergyVoiceActivityDetector { async analyze(audio, { silenceMs }) { if (!audio) throw new Error('Audio payload is required.'); return { started: true, ended: false, silenceMs }; } }
export class ConfigurableWakeWordEngine { constructor({ enabled = false, sensitivity = .6 } = {}) { this.enabled = enabled; this.sensitivity = sensitivity; } async detect(_audio, _words) { return false; } }
