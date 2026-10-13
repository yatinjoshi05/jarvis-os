import { useEffect, useState } from 'react';
import { Orbit } from 'lucide-react';
import { GlobeState } from '../model/GlobeTypes';
import { useQuantumGlobeEngine } from '../model/useQuantumGlobeEngine';
import { quantumGlobeEngine } from '../model/QuantumGlobeEngine';

interface GlobeStatusButtonProps {
  onOpenDiagnostics: () => void;
}

const stateStyles: Record<GlobeState, string> = {
  [GlobeState.Startup]: 'text-cyan-300 animate-pulse',
  [GlobeState.Idle]: 'text-cyan-200 animate-pulse',
  [GlobeState.Listening]: 'text-cyan-300 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.65)]',
  [GlobeState.Thinking]: 'text-violet-300',
  [GlobeState.Executing]: 'text-sky-300',
  [GlobeState.Speaking]: 'text-fuchsia-300',
  [GlobeState.Sleeping]: 'text-slate-400',
  [GlobeState.Music]: 'text-purple-300',
  [GlobeState.Success]: 'text-emerald-300 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]',
  [GlobeState.Error]: 'text-red-400 animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.6)]',
  [GlobeState.Shutdown]: 'text-white/30',
};

export function GlobeStatusButton({ onOpenDiagnostics }: GlobeStatusButtonProps) {
  const { state, mood, params } = useQuantumGlobeEngine();
  const [liveAmplitude, setLiveAmplitude] = useState(params.audioAmplitude);

  useEffect(() => {
    if (state !== GlobeState.Speaking) {
      setLiveAmplitude(params.audioAmplitude);
      return;
    }

    let frameId = 0;
    const updateAmplitude = () => {
      const nextAmplitude = quantumGlobeEngine.getParams().audioAmplitude;
      setLiveAmplitude((current) => Math.abs(current - nextAmplitude) > 0.002 ? nextAmplitude : current);
      frameId = requestAnimationFrame(updateAmplitude);
    };
    updateAmplitude();
    return () => cancelAnimationFrame(frameId);
  }, [state, params.audioAmplitude]);

  const energy = Math.round(Math.min(100, params.energyFlowSpeed * 40));
  const voiceScale = state === GlobeState.Speaking ? 1 + Math.min(liveAmplitude, 1) * 0.28 : 1;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onOpenDiagnostics}
        aria-label="Open Quantum Globe diagnostics"
        className={`relative rounded p-1 transition-all duration-300 hover:bg-white/5 hover:scale-110 ${stateStyles[state]}`}
      >
        <Orbit
          size={14}
          strokeWidth={1.7}
          className={state === GlobeState.Thinking ? 'animate-spin [animation-duration:2.8s]' : ''}
          style={{ transform: `scale(${voiceScale})` }}
        />
      </button>

      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-cyan-500/25 bg-black/95 p-2 text-[9px] font-mono text-white/75 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        <div className="mb-1 border-b border-white/10 pb-1 font-bold tracking-wider text-cyan-300">QUANTUM GLOBE</div>
        <div className="flex justify-between"><span>State</span><span className="text-white">{state}</span></div>
        <div className="flex justify-between"><span>Mood</span><span className="text-white">{mood}</span></div>
        <div className="flex justify-between"><span>Energy</span><span className="text-white">{energy}%</span></div>
      </div>
    </div>
  );
}

export default GlobeStatusButton;
