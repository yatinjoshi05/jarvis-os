import { useState } from 'react';
import { SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { globeStateManager } from '../../../entities/globe/model/GlobeStateManager';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    globeStateManager.setMusicPlaying(nextState);
  };

  return (
    <div className="w-full border border-white/10 rounded-xl p-3 bg-black/40 flex items-center space-x-3.5 h-16 flex-shrink-0 font-mono select-none text-white">
      {/* Album thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-950 to-blue-900 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]">
        <span className="text-[10px] text-white/50">🎵</span>
      </div>
      
      {/* Track details and playback controls */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div className="flex justify-between items-start">
          <div className="truncate">
            <div className="text-[10px] font-bold text-white leading-none">Dusk Till Dawn</div>
            <span className="text-[8px] text-white/40 mt-1 block">ZAYN, Sia</span>
          </div>
          {/* Equalizer animation */}
          {isPlaying && (
            <div className="flex items-end space-x-[2px] h-3 pr-1">
              <span className="w-[1.5px] h-2 bg-[#8800FF] rounded-full animate-pulse" />
              <span className="w-[1.5px] h-3 bg-[#8800FF] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-[1.5px] h-1 bg-[#8800FF] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
        
        {/* Controls buttons */}
        <div className="flex items-center space-x-3 text-white/60">
          <button className="hover:text-white transition-colors">
            <SkipBack size={10} />
          </button>
          <button
            onClick={togglePlay}
            className="w-4 h-4 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isPlaying ? (
              <Pause size={8} className="text-[#8800FF] fill-[#8800FF]" />
            ) : (
              <Play size={8} className="text-[#8800FF] fill-[#8800FF]" />
            )}
          </button>
          <button className="hover:text-white transition-colors">
            <SkipForward size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
