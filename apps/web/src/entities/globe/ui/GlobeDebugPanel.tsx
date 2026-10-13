import { quantumGlobeEngine } from '../model/QuantumGlobeEngine';
import { useQuantumGlobeEngine } from '../model/useQuantumGlobeEngine';
import { GlobeState, GlobeMood } from '../model/GlobeTypes';

interface GlobeDebugPanelProps {
  open: boolean;
  onClose: () => void;
}

export function GlobeDebugPanel({ open, onClose }: GlobeDebugPanelProps) {
  const { state, mood, params, debugConfig } = useQuantumGlobeEngine();
  if (!open) return null;

  const handleSliderChange = (key: keyof typeof debugConfig, value: number) => {
    quantumGlobeEngine.updateDebugConfig({ [key]: value });
  };

  const handleStateToggle = (targetState: GlobeState) => {
    const updated = { ...debugConfig.enabledStates };
    updated[targetState] = !updated[targetState];
    quantumGlobeEngine.updateDebugConfig({ enabledStates: updated });
  };

  const handleMoodSelect = (targetMood: GlobeMood) => {
    quantumGlobeEngine.setMood(targetMood);
    quantumGlobeEngine.updateDebugConfig({ forcedMood: targetMood });
  };

  const handleForceState = (targetState: GlobeState | null) => {
    quantumGlobeEngine.updateDebugConfig({ forcedState: targetState });
  };

  const handleTriggerAction = (action: string) => {
    if (action === 'startup') quantumGlobeEngine.startSequence();
    if (action === 'success') quantumGlobeEngine.triggerSuccess();
    if (action === 'error') quantumGlobeEngine.triggerError();
    if (action === 'shutdown') quantumGlobeEngine.shutdownSequence();
  };

  return (
    <div className="fixed top-16 right-4 bottom-4 z-50 w-96 bg-black/90 backdrop-blur-xl border border-cyan-500/40 text-cyan-300 font-mono text-xs rounded-xl shadow-2xl overflow-y-auto p-4 space-y-4 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-white tracking-wider">QUANTUM GLOBE ENGINE v2.0</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-1.5 py-0.5 rounded border border-gray-700 hover:border-gray-500"
        >
          ✕
        </button>
      </div>

      {/* Active State & Mood Display */}
      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-2.5 space-y-1.5">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-400">PRIMARY STATE:</span>
          <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
            {state.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-400">EMOTIONAL MOOD:</span>
          <span className="font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40">
            {mood.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-300 pt-1 border-t border-cyan-900/50">
          <div>Scale: <strong className="text-cyan-200">{params.scale.toFixed(3)}</strong></div>
          <div>Rotation: <strong className="text-cyan-200">{params.rotationMultiplier.toFixed(2)}x</strong></div>
          <div>Energy: <strong className="text-cyan-200">{params.energyFlowSpeed.toFixed(2)}x</strong></div>
          <div>Displacement: <strong className="text-cyan-200">{params.particleDisplacement.toFixed(3)}</strong></div>
          <div>Audio Amp: <strong className="text-cyan-200">{(params.audioAmplitude * 100).toFixed(0)}%</strong></div>
          <div>Glow: <strong className="text-cyan-200">{params.glowIntensity.toFixed(2)}x</strong></div>
        </div>
      </div>

      {/* Audio Spectrum & Telemetry Meter */}
      <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-2 space-y-1.5">
        <div className="text-white font-semibold text-[10px] tracking-wider">AUDIO & FFT SPECTRUM METERS</div>
        <div className="space-y-1">
          <div>
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>VOICE AMPLITUDE</span>
              <span>{(params.audioAmplitude * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all" style={{ width: `${params.audioAmplitude * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>MUSIC BASS (4% Displ)</span>
              <span>{(params.musicBass * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded overflow-hidden">
              <div className="bg-purple-500 h-full transition-all" style={{ width: `${params.musicBass * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>MUSIC MID (+30% Energy)</span>
              <span>{(params.musicMid * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded overflow-hidden">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${params.musicMid * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>MUSIC TREBLE (+20% Shimmer)</span>
              <span>{(params.musicTreble * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded overflow-hidden">
              <div className="bg-emerald-400 h-full transition-all" style={{ width: `${params.musicTreble * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mood Selector Buttons */}
      <div className="space-y-1.5">
        <div className="text-white font-semibold text-[11px]">MOOD ENGINE SELECTOR</div>
        <div className="grid grid-cols-4 gap-1">
          {Object.values(GlobeMood).map((m) => (
            <button
              key={m}
              onClick={() => handleMoodSelect(m)}
              className={`py-1 px-1 text-[10px] rounded border transition-all truncate ${
                mood === m
                  ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                  : 'bg-black/60 text-gray-400 border-gray-800 hover:border-gray-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* State Overrides & Triggers */}
      <div className="space-y-1.5">
        <div className="text-white font-semibold text-[11px]">PRIMARY STATE OVERRIDES</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(GlobeState).map((st) => (
            <button
              key={st}
              onClick={() => handleForceState(debugConfig.forcedState === st ? null : st)}
              className={`px-2 py-1 text-[10px] rounded border transition-all truncate ${
                debugConfig.forcedState === st
                  ? 'bg-amber-500 text-black border-amber-400 font-bold'
                  : state === st
                  ? 'bg-cyan-900/60 text-cyan-200 border-cyan-500'
                  : 'bg-black/60 text-gray-400 border-gray-800 hover:border-gray-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        {debugConfig.forcedState && (
          <button
            onClick={() => handleForceState(null)}
            className="w-full mt-1 py-1 text-[10px] bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/40 rounded font-bold"
          >
            CLEAR FORCED STATE OVERRIDE
          </button>
        )}
      </div>

      {/* Quick Action Sequence Triggers */}
      <div className="space-y-1.5">
        <div className="text-white font-semibold text-[11px]">ONE-SHOT ACTION TRIGGERS</div>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleTriggerAction('startup')}
            className="py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[10px] rounded"
          >
            Startup
          </button>
          <button
            onClick={() => handleTriggerAction('success')}
            className="py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] rounded"
          >
            Success
          </button>
          <button
            onClick={() => handleTriggerAction('error')}
            className="py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[10px] rounded"
          >
            Error
          </button>
          <button
            onClick={() => handleTriggerAction('shutdown')}
            className="py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-[10px] rounded"
          >
            Shutdown
          </button>
        </div>
      </div>

      {/* Live Parameter Sliders */}
      <div className="space-y-2 border-t border-cyan-500/30 pt-3">
        <div className="text-white font-semibold text-[11px]">PARAMETER MULTIPLIERS</div>

        {[
          { label: 'Rotation Speed', key: 'rotationSpeedMult', min: 0, max: 3, step: 0.1 },
          { label: 'Breathing Amount', key: 'breathingAmountMult', min: 0, max: 2, step: 0.1 },
          { label: 'Voice Sensitivity', key: 'audioScaleMult', min: 0.5, max: 2.5, step: 0.1 },
          { label: 'Thinking Speed', key: 'thinkingSpeedMult', min: 0.5, max: 3.0, step: 0.1 },
          { label: 'Energy Flow', key: 'energyFlowMult', min: 0.1, max: 3.0, step: 0.1 },
          { label: 'Particle Motion', key: 'particleDisplacementMult', min: 0, max: 3.0, step: 0.1 },
          { label: 'FFT Sensitivity', key: 'musicSensitivityMult', min: 0, max: 3.0, step: 0.1 },
          { label: 'Glow Intensity', key: 'glowMult', min: 0.2, max: 2.5, step: 0.1 },
          { label: 'Transition Speed', key: 'transitionSpeedMult', min: 0.2, max: 3.0, step: 0.1 },
        ].map((item) => {
          const val = debugConfig[item.key as keyof typeof debugConfig] as number;
          return (
            <div key={item.key} className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>{item.label}</span>
                <span className="text-cyan-400 font-bold">{val.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={val}
                onChange={(e) => handleSliderChange(item.key as any, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-cyan-950 accent-cyan-400 rounded-lg cursor-pointer"
              />
            </div>
          );
        })}
      </div>

      {/* Enable/Disable States Toggles */}
      <div className="space-y-1.5 border-t border-cyan-500/30 pt-3">
        <div className="text-white font-semibold text-[11px]">ENABLED STATES</div>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {Object.values(GlobeState).map((st) => {
            const enabled = debugConfig.enabledStates[st];
            return (
              <button
                key={st}
                onClick={() => handleStateToggle(st)}
                className={`py-0.5 px-1.5 rounded border text-left flex items-center justify-between ${
                  enabled
                    ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300'
                    : 'bg-black/60 border-gray-800 text-gray-600 line-through'
                }`}
              >
                <span>{st}</span>
                <span className="text-[9px]">{enabled ? 'ON' : 'OFF'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GlobeDebugPanel;
