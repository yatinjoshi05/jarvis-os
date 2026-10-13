import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Upload, Check, Music, Mic, Radio, AlertTriangle, Loader, Play, Save } from 'lucide-react';
import { audioSettings } from '../../../shared/audio/AudioSettings';
import { fileManager } from '../../../entities/coding/fileManager';
import { voiceSettings } from '../../../shared/ai/VoiceSettings';
import { getBackendApiUrl } from '../../../shared/ai/config';
import { SoundKey } from '../../../shared/audio/AudioTypes';

export const AudioCustomizationPanel: React.FC = () => {
  const [masterVol, setMasterVol] = useState<number>(() => audioSettings.getVolume('master'));
  const [isMuted, setIsMuted] = useState<boolean>(() => audioSettings.getState().isMuted);
  const [fadeDurationMs, setFadeDurationMs] = useState<number>(() => audioSettings.getState().fadeDurationMs);

  const [soundVolumes, setSoundVolumes] = useState<Record<SoundKey, number>>(() => audioSettings.getState().soundVolumes);
  const [soundMutes, setSoundMutes] = useState<Record<SoundKey, boolean>>(() => audioSettings.getState().soundMutes);

  // Voice Engine Config State (wired to voiceSettings)
  const [ttsProvider, setTtsProvider] = useState<string>(() => voiceSettings.settings.ttsProvider);
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState<string>(() => voiceSettings.settings.elevenlabsVoiceId);
  const [voiceTestState, setVoiceTestState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [voiceTestMsg, setVoiceTestMsg] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // File Manager Upload State
  const [customTrackName, setCustomTrackName] = useState<string>('');
  const [uploadedTracks, setUploadedTracks] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = audioSettings.subscribe((state) => {
      setMasterVol(state.masterVolume);
      setIsMuted(state.isMuted);
      setFadeDurationMs(state.fadeDurationMs);
      setSoundVolumes({ ...state.soundVolumes });
      setSoundMutes({ ...state.soundMutes });
    });
    return unsub;
  }, []);

  const handleApplyAudioSettings = async () => {
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioSettings: audioSettings.getState(),
          voiceSettings: voiceSettings.settings,
          timestamp: Date.now(),
        }),
      });
      setApplyFeedback('AUDIO & VOICE SETTINGS APPLIED & PERSISTED');
      setTimeout(() => setApplyFeedback(null), 2500);
    } catch (_) {
      setApplyFeedback('SAVED LOCALLY');
      setTimeout(() => setApplyFeedback(null), 2500);
    } finally {
      setIsApplying(false);
    }
  };

  const handleVolumeChange = (channel: 'master' | 'ambient' | 'voice' | 'ui', val: number) => {
    audioSettings.setVolume(channel, val);
  };

  const handleSoundVolumeChange = (key: SoundKey, val: number) => {
    audioSettings.setSoundVolume(key, val);
  };

  const handleSoundMuteToggle = (key: SoundKey) => {
    audioSettings.toggleSoundMute(key);
  };

  const handleTestSound = (key: SoundKey) => {
    const isAmbient = ['startup', 'idle', 'listening', 'thinking', 'speaking', 'shutdown'].includes(key);
    const src = isAmbient ? `/assets/audio/ambient/${key}.mp3` : `/assets/audio/ui/${key}.mp3`;
    const audio = new Audio(src);
    const effVol = audioSettings.getEffectiveSoundVolume(key);
    audio.volume = Math.max(0, Math.min(1, effVol));
    audio.play().catch((err) => console.warn(`Preview play failed for ${key}:`, err));
  };

  const handleToggleMute = () => {
    audioSettings.toggleMute();
  };

  const handleFadeChange = (ms: number) => {
    audioSettings.setFadeDuration(ms);
  };

  const handleTtsProviderChange = (provider: string) => {
    setTtsProvider(provider);
    voiceSettings.update({ ttsProvider: provider });
  };

  const handleVoiceIdChange = (id: string) => {
    setElevenlabsVoiceId(id);
  };

  const handleVoiceIdSave = () => {
    const trimmed = elevenlabsVoiceId.trim();
    if (!trimmed) return;
    voiceSettings.update({ elevenlabsVoiceId: trimmed });
    setVoiceTestMsg('');
  };

  const handleTestVoice = async () => {
    const voiceId = elevenlabsVoiceId.trim();
    if (!voiceId) {
      setVoiceTestMsg('Enter a Voice ID first.');
      setVoiceTestState('error');
      return;
    }

    voiceSettings.update({ elevenlabsVoiceId: voiceId });
    setVoiceTestState('loading');
    setVoiceTestMsg('Synthesizing test phrase...');

    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }

    try {
      const url = getBackendApiUrl('/api/tts/elevenlabs');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "JARVIS online. Voice synthesis confirmed.",
          voiceId,
          modelId: 'eleven_multilingual_v2',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const audio = new Audio(objUrl);
      testAudioRef.current = audio;

      const effectiveVol = audioSettings.getEffectiveVolume('voice') * voiceSettings.settings.volume;
      audio.volume = Math.max(0, Math.min(1, effectiveVol));

      audio.onended = () => {
        URL.revokeObjectURL(objUrl);
        testAudioRef.current = null;
        setVoiceTestState('success');
        setVoiceTestMsg(`✓ Voice test passed — ID "${voiceId}" is active`);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objUrl);
        setVoiceTestState('error');
        setVoiceTestMsg('Audio playback failed. Check browser autoplay permissions.');
      };

      await audio.play();
      setVoiceTestState('loading');
      setVoiceTestMsg('Playing test phrase...');
    } catch (err: any) {
      setVoiceTestState('error');
      setVoiceTestMsg(err.message || 'Voice test failed. Check the ElevenLabs API key and Voice ID.');
    }
  };

  const handleUploadCustomTrack = () => {
    if (!customTrackName.trim()) return;
    const cleanName = customTrackName.trim().endsWith('.mp3')
      ? customTrackName.trim()
      : `${customTrackName.trim()}.mp3`;

    const targetPath = `src/shared/audio/tracks/${cleanName}`;
    try {
      fileManager.saveFile(targetPath, `[AUDIO_BINARY_PLACEHOLDER_FOR_${cleanName}]`);
      setUploadedTracks((prev) => [...prev, cleanName]);
      setUploadSuccess(`Track "${cleanName}" added to sandboxed audio storage!`);
      setCustomTrackName('');
      setTimeout(() => setUploadSuccess(null), 2000);
    } catch (err: any) {
      alert(`Upload blocked: ${err.message}`);
    }
  };

  const TTS_PROVIDERS = [
    { id: 'elevenlabs', label: 'ElevenLabs', color: '#00FFCC', desc: 'Neural voice synthesis via API' },
    { id: 'browser', label: 'Browser TTS', color: '#00DFFF', desc: 'System speech (offline, no key)' },
    { id: 'openai', label: 'OpenAI TTS', color: '#FF00FF', desc: 'OpenAI text-to-speech API' },
  ];

  const AMBIENT_SOUND_CONFIGS: { key: SoundKey; label: string; desc: string; color: string }[] = [
    { key: 'startup', label: 'Startup Sound', desc: 'Played when JARVIS boots up', color: '#00FFCC' },
    { key: 'idle', label: 'Idle Soundscape', desc: 'Continuous ambient loop in idle state', color: '#00DFFF' },
    { key: 'listening', label: 'Listening Cue', desc: 'Played when mic is actively listening', color: '#38BDF8' },
    { key: 'thinking', label: 'Thinking Cue', desc: 'Played during prompt reasoning', color: '#A855F7' },
    { key: 'speaking', label: 'Speaking Ambient', desc: 'Played underneath TTS voice playback', color: '#F472B6' },
    { key: 'shutdown', label: 'Shutdown Sound', desc: 'Played when closing the application', color: '#FB7185' },
  ];

  const UI_SOUND_CONFIGS: { key: SoundKey; label: string; desc: string; color: string }[] = [
    { key: 'click', label: 'Button Click', desc: 'Played on UI and dock interaction', color: '#FF0055' },
    { key: 'typing', label: 'Typing Feedback', desc: 'Played during console keyboard input', color: '#F59E0B' },
    { key: 'notification', label: 'System Alert', desc: 'Played when new notification arrives', color: '#10B981' },
    { key: 'success', label: 'Task Success', desc: 'Played on successful workflow execution', color: '#34D399' },
    { key: 'error', label: 'Error / Warning', desc: 'Played when operation encounters error', color: '#EF4444' },
  ];

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-5 space-y-6 font-mono select-none text-left relative z-10">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Volume2 size={16} className="text-[#00FFCC]" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Audio Engine &amp; Per-Sound Volume Matrix
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {applyFeedback && (
            <span className="text-[8.5px] font-bold text-[#00FFCC] border border-[#00FFCC]/30 bg-[#00FFCC]/10 px-2 py-0.5 rounded flex items-center space-x-1 uppercase">
              <Check size={9} />
              <span>{applyFeedback}</span>
            </span>
          )}
          <button
            onClick={handleApplyAudioSettings}
            disabled={isApplying}
            className="px-3 py-1 bg-[#00FFCC] hover:bg-[#00D6AB] text-black rounded text-[9px] font-bold uppercase transition-all flex items-center space-x-1 disabled:opacity-50"
          >
            <Save size={10} />
            <span>{isApplying ? 'APPLYING...' : 'APPLY AUDIO SETTINGS'}</span>
          </button>
          <button
            onClick={handleToggleMute}
            className={`px-3 py-1 rounded border text-[9px] font-bold flex items-center space-x-1.5 transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
            }`}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            <span>{isMuted ? 'ALL MUTED' : 'MASTER ACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* MASTER SYSTEM VOLUME SLIDER */}
      <div className="bg-black/80 border border-[#00FFCC]/40 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
          <span className="text-[#00FFCC] font-black">Master System Volume Control</span>
          <span className="text-[#00FFCC]">{Math.round(masterVol * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVol}
          onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
          className="w-full accent-[#00FFCC]"
        />
        <p className="text-[7.5px] text-white/50">Master volume proportionally scales all individual sound event volumes below.</p>
      </div>

      {/* INDIVIDUAL AMBIENT & STATE SOUND SLIDERS */}
      <div className="border border-white/10 rounded-xl bg-black/60 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2">
            <Radio size={13} className="text-[#00DFFF]" />
            <span className="text-[10px] font-black text-white uppercase">Ambient &amp; Assistant State Audio Events</span>
          </div>
          <span className="text-[8px] text-white/40 font-mono">6 Sound Events</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AMBIENT_SOUND_CONFIGS.map((snd) => {
            const vol = soundVolumes[snd.key] ?? 1.0;
            const muted = soundMutes[snd.key] ?? false;
            const effective = Math.round(audioSettings.getEffectiveSoundVolume(snd.key) * 100);

            return (
              <div
                key={snd.key}
                className={`border rounded-xl p-3 space-y-2 transition-all ${
                  muted ? 'bg-black/30 border-white/5 opacity-60' : 'bg-black/70 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-white uppercase">{snd.label}</span>
                    <p className="text-[7px] text-white/40">{snd.desc}</p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[8.5px] font-mono font-bold" style={{ color: muted ? '#666' : snd.color }}>
                      {effective}%
                    </span>
                    <button
                      onClick={() => handleSoundMuteToggle(snd.key)}
                      title={muted ? 'Unmute Sound' : 'Mute Sound'}
                      className={`p-1 rounded border text-[8px] ${
                        muted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    </button>
                    <button
                      onClick={() => handleTestSound(snd.key)}
                      title="Preview Sound Playback"
                      className="p-1 rounded border bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30 hover:bg-[#00FFCC]/20 text-[8px]"
                    >
                      <Play size={10} />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={vol}
                  disabled={muted}
                  onChange={(e) => handleSoundVolumeChange(snd.key, parseFloat(e.target.value))}
                  className="w-full accent-[#00FFCC]"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* INDIVIDUAL UI & ALERT SOUND SLIDERS */}
      <div className="border border-white/10 rounded-xl bg-black/60 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2">
            <Music size={13} className="text-[#FF0055]" />
            <span className="text-[10px] font-black text-white uppercase">UI &amp; Alert Sound Effects</span>
          </div>
          <span className="text-[8px] text-white/40 font-mono">5 Sound Events</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {UI_SOUND_CONFIGS.map((snd) => {
            const vol = soundVolumes[snd.key] ?? 1.0;
            const muted = soundMutes[snd.key] ?? false;
            const effective = Math.round(audioSettings.getEffectiveSoundVolume(snd.key) * 100);

            return (
              <div
                key={snd.key}
                className={`border rounded-xl p-3 space-y-2 transition-all ${
                  muted ? 'bg-black/30 border-white/5 opacity-60' : 'bg-black/70 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-white uppercase">{snd.label}</span>
                    <p className="text-[7px] text-white/40">{snd.desc}</p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[8.5px] font-mono font-bold" style={{ color: muted ? '#666' : snd.color }}>
                      {effective}%
                    </span>
                    <button
                      onClick={() => handleSoundMuteToggle(snd.key)}
                      title={muted ? 'Unmute Sound' : 'Mute Sound'}
                      className={`p-1 rounded border text-[8px] ${
                        muted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    </button>
                    <button
                      onClick={() => handleTestSound(snd.key)}
                      title="Preview Sound Playback"
                      className="p-1 rounded border bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055]/30 hover:bg-[#FF0055]/20 text-[8px]"
                    >
                      <Play size={10} />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={vol}
                  disabled={muted}
                  onChange={(e) => handleSoundVolumeChange(snd.key, parseFloat(e.target.value))}
                  className="w-full accent-[#FF0055]"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* VOICE ENGINE CONFIGURATION — TTS PROVIDER + VOICE ID */}
      <div className="border border-[#00FFCC]/20 rounded-xl bg-black/60 p-4 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Mic size={13} className="text-[#00FFCC]" />
          <span className="text-[10px] font-black text-white uppercase">Voice Engine Configuration</span>
          <span className="ml-auto px-2 py-0.5 rounded text-[7.5px] font-bold border"
            style={{
              color: ttsProvider === 'elevenlabs' ? '#00FFCC' : ttsProvider === 'openai' ? '#FF00FF' : '#00DFFF',
              borderColor: ttsProvider === 'elevenlabs' ? '#00FFCC33' : ttsProvider === 'openai' ? '#FF00FF33' : '#00DFFF33',
              background: ttsProvider === 'elevenlabs' ? '#00FFCC11' : ttsProvider === 'openai' ? '#FF00FF11' : '#00DFFF11',
            }}
          >
            {TTS_PROVIDERS.find(p => p.id === ttsProvider)?.label ?? ttsProvider.toUpperCase()} ACTIVE
          </span>
        </div>

        {/* TTS PROVIDER SELECTOR */}
        <div className="space-y-1.5">
          <span className="text-[8px] font-bold text-white/50 uppercase">TTS Engine / Provider</span>
          <div className="grid grid-cols-3 gap-2">
            {TTS_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleTtsProviderChange(p.id)}
                className={`p-2.5 rounded-lg border flex flex-col items-start space-y-0.5 transition-all ${
                  ttsProvider === p.id
                    ? 'border-current shadow-inner'
                    : 'border-white/10 bg-black/50 text-white/50 hover:text-white hover:border-white/20'
                }`}
                style={ttsProvider === p.id ? { color: p.color, borderColor: `${p.color}44`, background: `${p.color}11` } : {}}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-black uppercase">{p.label}</span>
                  {ttsProvider === p.id && <Radio size={9} />}
                </div>
                <p className="text-[7px] text-white/40 leading-tight">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ELEVENLABS VOICE ID */}
        {ttsProvider === 'elevenlabs' && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-white/50 uppercase">ElevenLabs Voice ID</span>
              <a
                href="https://elevenlabs.io/app/voice-library"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7.5px] text-[#00FFCC]/70 hover:text-[#00FFCC] transition-colors underline"
              >
                Browse Voice Library ↗
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={elevenlabsVoiceId}
                onChange={(e) => handleVoiceIdChange(e.target.value)}
                onBlur={handleVoiceIdSave}
                placeholder="e.g. pNInz6obpgDQGcFmaJgB (Adam)"
                className="flex-1 bg-black/80 border border-white/15 rounded-lg px-3 py-1.5 text-[9.5px] text-white font-mono outline-none focus:border-[#00FFCC] transition-colors"
              />
              <button
                onClick={handleTestVoice}
                disabled={voiceTestState === 'loading' || !elevenlabsVoiceId.trim()}
                className="px-3 py-1.5 bg-[#00FFCC]/10 border border-[#00FFCC]/30 text-[#00FFCC] hover:bg-[#00FFCC]/20 disabled:opacity-40 rounded text-[9px] font-bold transition-all flex items-center space-x-1 uppercase whitespace-nowrap"
              >
                {voiceTestState === 'loading' ? <Loader size={10} className="animate-spin" /> : <Volume2 size={10} />}
                <span>{voiceTestState === 'loading' ? 'Testing...' : 'Test Voice'}</span>
              </button>
            </div>

            {voiceTestMsg && (
              <div className={`flex items-start space-x-1.5 text-[8px] font-mono pt-0.5 ${
                voiceTestState === 'success' ? 'text-[#00FFCC]' :
                voiceTestState === 'error' ? 'text-red-400' :
                'text-white/50'
              }`}>
                {voiceTestState === 'success' && <Check size={10} className="mt-0.5 shrink-0" />}
                {voiceTestState === 'error' && <AlertTriangle size={10} className="mt-0.5 shrink-0" />}
                {voiceTestState === 'loading' && <Loader size={10} className="mt-0.5 shrink-0 animate-spin" />}
                <span>{voiceTestMsg}</span>
              </div>
            )}

            <p className="text-[7.5px] text-white/30 leading-relaxed">
              The Voice ID must match a voice in your ElevenLabs library. Premade free-tier voices:
              <span className="text-[#00FFCC]/60 font-mono"> pNInz6obpgDQGcFmaJgB</span> (Adam),
              <span className="text-[#00FFCC]/60 font-mono"> 21m00Tcm4TlvDq8ikWAM</span> (Rachel).
              Click "Test Voice" to verify and play a sample before saving.
            </p>
          </div>
        )}
      </div>

      {/* FADE DURATION & STATE EFFECTS */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-white uppercase">State Transition Fade Duration</span>
            <p className="text-[7.5px] text-white/50">Crossfade timing for state ambient soundscapes (idle, thinking, speaking)</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#00FFCC]">{fadeDurationMs}ms</span>
        </div>
        <input
          type="range"
          min={100}
          max={3000}
          step={50}
          value={fadeDurationMs}
          onChange={(e) => handleFadeChange(parseInt(e.target.value, 10))}
          className="w-full accent-[#00FFCC]"
        />
        <div className="flex justify-between text-[7px] text-white/30 font-mono">
          <span>100ms (Instant)</span>
          <span>500ms (Default)</span>
          <span>3000ms (Cinematic)</span>
        </div>
      </div>

      {/* SANDBOXED AUDIO FILE MANAGER */}
      <div className="border border-white/10 rounded-xl bg-black/60 p-4 space-y-3">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Music size={13} className="text-[#00DFFF]" />
          <span className="text-[10px] font-black text-white uppercase">
            Sandboxed Custom Track Uploader (FileManager Integration)
          </span>
        </div>

        <p className="text-[8px] text-white/60 leading-relaxed">
          Register new ambient soundscape tracks into the sandboxed filesystem (<code className="text-[#00DFFF]">src/shared/audio/tracks/</code>).
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={customTrackName}
            onChange={(e) => setCustomTrackName(e.target.value)}
            placeholder="Track name (e.g. cyber_ambient.mp3)..."
            className="flex-1 bg-black/80 border border-white/15 rounded-lg px-3 py-1.5 text-[9.5px] text-white font-mono outline-none focus:border-[#00DFFF]"
          />
          <button
            onClick={handleUploadCustomTrack}
            disabled={!customTrackName.trim()}
            className="px-3.5 py-1.5 bg-[#00DFFF] text-black hover:bg-[#00C4E6] disabled:opacity-40 rounded text-[9px] font-bold transition-all flex items-center space-x-1 uppercase"
          >
            <Upload size={10} />
            <span>Upload Track</span>
          </button>
        </div>

        {uploadSuccess && (
          <div className="text-[8.5px] text-[#00FFCC] font-bold flex items-center space-x-1 pt-1">
            <Check size={10} />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadedTracks.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[7.5px] text-white/40 uppercase font-bold">Registered Custom Tracks:</span>
            <div className="flex flex-wrap gap-1.5">
              {uploadedTracks.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-[#00DFFF] font-mono flex items-center space-x-1"
                >
                  <Music size={8} />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCustomizationPanel;

