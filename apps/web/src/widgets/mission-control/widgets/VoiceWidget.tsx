import React, { useState } from 'react';
import { useMissionControlStore } from '../store/missionControlStore';
import { Mic, MicOff, Sparkles, Languages } from 'lucide-react';

export const VoiceWidget: React.FC = () => {
  const { voiceState, startListening, stopListening, executeCommand } = useMissionControlStore();
  const [customCommand, setCustomCommand] = useState('');

  const isListening = voiceState.state === 'Listening';

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCommand.trim()) {
      executeCommand(customCommand.trim());
      setCustomCommand('');
    }
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMic}
            className={`p-2 rounded-xl transition-all ${isListening ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}
          >
            {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
              VOICE INTEGRATION
            </h3>
            <span className="text-[9px] font-mono text-emerald-400 block">
              STATE: {voiceState.state.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[9px] font-mono text-white/50 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
          <Languages className="w-3 h-3 text-cyan-400" />
          <span>{voiceState.language}</span>
        </div>
      </div>

      {/* Transcript & Last Command Box */}
      <div className="p-3 rounded-xl bg-[#070914] border border-white/10 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-[9px] text-white/40">
          <span>LIVE TRANSCRIPT</span>
          {isListening && (
            <div className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVE MIC</span>
            </div>
          )}
        </div>

        <p className="text-[11px] font-semibold text-white/90 truncate">
          "{voiceState.transcript || 'Click mic button or speak command...'}"
        </p>

        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-white/50">
          <span>LAST COMMAND:</span>
          <span className="text-[#00DFFF] font-semibold truncate max-w-[160px]">{voiceState.lastCommand}</span>
        </div>
      </div>

      {/* Voice Quick Command Bar */}
      <form onSubmit={handleCommandSubmit} className="relative flex items-center">
        <input
          type="text"
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          placeholder="Speak or type command (e.g. 'Open Browser')..."
          className="w-full bg-[#121526] border border-white/10 rounded-xl pl-3 pr-8 py-1 text-[10px] font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
        />
        <button type="submit" className="absolute right-2 text-cyan-400 hover:text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
