import { useEffect, useState } from 'react';
import { 
  Volume2, VolumeX, Play, Square, Radio
} from 'lucide-react';
import { audioSettings } from '../../../shared/audio/AudioSettings';
import { audioMixer } from '../../../shared/audio/AudioMixer';
import { audioStateMachine } from '../../../shared/audio/AudioStateMachine';
import { audioEvents } from '../../../shared/audio/AudioEvents';
import { AudioState, AudioChannel } from '../../../shared/audio/AudioTypes';

export default function AudioDebugPanel() {
  const [currentState, setCurrentState] = useState<AudioState>(() => audioStateMachine.state);
  const [ambientVol, setAmbientVol] = useState<number>(() => audioSettings.getVolume('ambient'));
  const [uiVol, setUiVol] = useState<number>(() => audioSettings.getVolume('ui'));
  const [voiceVol, setVoiceVol] = useState<number>(() => audioSettings.getVolume('voice'));
  const [masterVol, setMasterVol] = useState<number>(() => audioSettings.getVolume('master'));
  const [isMuted, setIsMuted] = useState<boolean>(() => audioSettings.getState().isMuted);
  const [playingTrack, setPlayingTrack] = useState<string>('idle.mp3');
  const [fadeDuration, setFadeDuration] = useState<number>(() => audioSettings.getState().fadeDurationMs);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`[AudioDebugPanel] ${msg}`);
    setLogMessages((prev) => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    const unsubState = audioStateMachine.subscribe((newState) => {
      setCurrentState(newState);
      const src = audioStateMachine.getAmbientSrcForState(newState);
      const trackName = src ? src.split('/').pop() || 'None' : 'None';
      setPlayingTrack(trackName);
      addLog(`State Changed ➔ ${newState} (Track: ${trackName})`);
    });

    const unsubSettings = audioSettings.subscribe((s) => {
      setAmbientVol(s.ambientVolume);
      setUiVol(s.uiVolume);
      setVoiceVol(s.voiceVolume);
      setMasterVol(s.masterVolume);
      setIsMuted(s.isMuted);
      setFadeDuration(s.fadeDurationMs);
    });

    const unsubEvents = audioEvents.on('soundPlayed', (data) => {
      addLog(`UI Sound Played: ${data.type}`);
    });

    return () => {
      unsubState();
      unsubSettings();
      unsubEvents();
    };
  }, []);

  const handleManualPlay = async (state: AudioState) => {
    addLog(`Manual Test Triggered ➔ ${state}`);
    const src = audioStateMachine.getAmbientSrcForState(state);
    if (!src) {
      addLog(`Error: No ambient asset for state ${state}`);
      return;
    }
    audioStateMachine.transitionTo(state);
    const success = await audioMixer.playAmbient(src, true);
    if (!success) {
      addLog(`Error: Failed to play ${src}. Browser autoplay policy or AudioContext suspended.`);
    } else {
      addLog(`Playing ${src.split('/').pop()} successfully on ambient channel.`);
    }
  };

  const handleStopAll = async () => {
    addLog('Stopping all audio streams...');
    await audioMixer.stopAmbient(100);
    audioStateMachine.transitionTo('Exit');
  };

  const handleVolumeSlider = (channel: AudioChannel, val: number) => {
    audioSettings.setVolume(channel, val);
    addLog(`Volume ${channel} set to ${Math.round(val * 100)}%`);
  };

  const handleToggleMute = () => {
    const muted = audioSettings.toggleMute();
    addLog(`Engine Mute Toggled ➔ ${muted ? 'MUTED' : 'UNMUTED'}`);
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none font-mono text-white bg-black/60 border border-white/10 rounded-xl p-4 shadow-2xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2.5">
          <Radio size={16} className="text-[#00DFFF] animate-pulse" />
          <h3 className="text-xs font-black tracking-widest uppercase text-white/90">
            AUDIO ENGINE DEBUGGER & CONTROL MATRIX
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[8px] font-black border tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            AUDIO CONTEXT: RUNNING
          </span>
          <button
            onClick={handleToggleMute}
            className={`p-1.5 rounded border text-[9px] font-bold flex items-center space-x-1 ${
              isMuted ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
            <span>{isMuted ? 'MUTED' : 'MUTE'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[8px] text-white/40 uppercase font-bold">Audio State</span>
          <div className="text-xs font-black text-[#00DFFF] truncate">{currentState}</div>
        </div>

        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[8px] text-white/40 uppercase font-bold">Playing Track</span>
          <div className="text-xs font-black text-emerald-400 truncate">{playingTrack}</div>
        </div>

        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[8px] text-white/40 uppercase font-bold">Master Gain</span>
          <div className="text-xs font-black text-purple-400">{Math.round(masterVol * 100)}%</div>
        </div>

        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[8px] text-white/40 uppercase font-bold">Fade Duration</span>
          <div className="text-xs font-black text-amber-400">{fadeDuration}ms</div>
        </div>
      </div>

      {/* Independent Volume Controls */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
        <span className="text-[9px] font-black tracking-widest text-[#FF00FF] uppercase border-b border-white/5 pb-1 block">
          CHANNEL GAIN SLIDERS
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px]">
          {/* Ambient Channel */}
          <div className="space-y-1">
            <div className="flex justify-between text-white/70">
              <span>Ambient Channel</span>
              <span className="font-bold text-[#00DFFF]">{Math.round(ambientVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVol}
              onChange={(e) => handleVolumeSlider('ambient', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00DFFF]"
            />
          </div>

          {/* Voice Channel */}
          <div className="space-y-1">
            <div className="flex justify-between text-white/70">
              <span>Voice Channel</span>
              <span className="font-bold text-emerald-400">{Math.round(voiceVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={voiceVol}
              onChange={(e) => handleVolumeSlider('voice', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* UI Channel */}
          <div className="space-y-1">
            <div className="flex justify-between text-white/70">
              <span>UI Sounds Channel</span>
              <span className="font-bold text-purple-400">{Math.round(uiVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={uiVol}
              onChange={(e) => handleVolumeSlider('ui', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Master Channel */}
          <div className="space-y-1">
            <div className="flex justify-between text-white/70">
              <span>Master Channel</span>
              <span className="font-bold text-amber-400">{Math.round(masterVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVol}
              onChange={(e) => handleVolumeSlider('master', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Manual Test Buttons */}
      <div className="space-y-2">
        <span className="text-[9px] font-black tracking-widest text-white/60 uppercase">
          MANUAL PLAYBACK TEST BUTTONS
        </span>
        <div className="flex flex-wrap gap-2 text-[9px]">
          <button
            onClick={() => handleManualPlay('Startup')}
            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-[#00DFFF]/20 hover:border-[#00DFFF]/50 text-white font-bold flex items-center space-x-1 transition-all"
          >
            <Play size={10} className="text-[#00DFFF]" />
            <span>Play Startup</span>
          </button>

          <button
            onClick={() => handleManualPlay('Idle')}
            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-white font-bold flex items-center space-x-1 transition-all"
          >
            <Play size={10} className="text-emerald-400" />
            <span>Play Idle</span>
          </button>

          <button
            onClick={() => handleManualPlay('Listening')}
            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 text-white font-bold flex items-center space-x-1 transition-all"
          >
            <Play size={10} className="text-amber-400" />
            <span>Play Listening</span>
          </button>

          <button
            onClick={() => handleManualPlay('Thinking')}
            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 text-white font-bold flex items-center space-x-1 transition-all"
          >
            <Play size={10} className="text-purple-400" />
            <span>Play Thinking</span>
          </button>

          <button
            onClick={() => handleManualPlay('Speaking')}
            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 text-white font-bold flex items-center space-x-1 transition-all"
          >
            <Play size={10} className="text-rose-400" />
            <span>Play Speaking</span>
          </button>

          <button
            onClick={handleStopAll}
            className="px-2.5 py-1.5 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold flex items-center space-x-1 transition-all ml-auto"
          >
            <Square size={10} />
            <span>Stop All</span>
          </button>
        </div>
      </div>

      {/* Live Log Stream */}
      <div className="bg-black/80 border border-white/5 rounded-lg p-2.5 space-y-1">
        <div className="flex items-center justify-between text-[8px] text-white/30 border-b border-white/5 pb-1">
          <span>REAL-TIME AUDIO LOG STREAM</span>
          <span>CONSOLE SYNCED</span>
        </div>
        <div className="space-y-0.5 max-h-24 overflow-y-auto hide-scrollbar text-[8px] text-white/70 font-mono">
          {logMessages.length === 0 ? (
            <div className="text-white/30 italic">No audio logs generated yet.</div>
          ) : (
            logMessages.map((log, idx) => (
              <div key={idx} className="truncate">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
