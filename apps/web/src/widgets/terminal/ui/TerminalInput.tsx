import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';

interface TerminalInputProps {
  onSend: (value: string) => void;
  onAskAI?: (value: string) => void;
  disabled?: boolean;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  onSend,
  onAskAI,
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };

  const handleAI = () => {
    if (!value.trim() || disabled) return;
    onAskAI?.(value);
    setValue('');
  };

  return (
    <div className="p-2.5 bg-[#050508]/80 backdrop-blur-md border-t border-white/10 select-none">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center px-3 py-1.5 rounded-xl bg-[#0C0D14]/90 border transition-all duration-300 shadow-md ${
          isFocused
            ? 'border-[#EC4899] shadow-[0_0_15px_rgba(236,72,153,0.2)]'
            : 'border-[#EC4899]/40 hover:border-[#EC4899]/70'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a command or ask JARVIS..."
          disabled={disabled}
          className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-white/30 focus:outline-none"
        />

        <div className="flex items-center space-x-1.5 ml-2">
          {/* AI Button */}
          <button
            type="button"
            onClick={handleAI}
            title="Ask JARVIS AI"
            className="p-1.5 rounded-lg bg-gradient-to-r from-[#EC4899]/20 to-[#00DFFF]/20 hover:from-[#EC4899]/40 hover:to-[#00DFFF]/40 border border-[#EC4899]/30 text-[#EC4899] hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            title="Send Command"
            className={`p-1.5 rounded-lg transition-all duration-200 transform ${
              value.trim()
                ? 'bg-[#EC4899] text-white hover:bg-[#ff2a85] shadow-[0_0_10px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
