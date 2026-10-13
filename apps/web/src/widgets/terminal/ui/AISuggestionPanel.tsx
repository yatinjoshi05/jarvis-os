import React, { useState } from 'react';
import { AISuggestionCard } from '../types';
import { useAISuggestionStore } from '../model/useAISuggestionStore';
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  Sparkles,
  Copy,
  ArrowRight,
  AlertTriangle,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface AISuggestionPanelProps {
  suggestions: AISuggestionCard[];
  activeShell?: string;
  onSelectSuggestion: (cmd: string) => void;
  onAskJARVIS?: () => void;
}

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions: presetCards,
  activeShell = 'powershell',
  onSelectSuggestion,
  onAskJARVIS,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    suggestions: aiSuggestions,
    selectCard,
    copyCommand,
    insertCommand,
  } = useAISuggestionStore();

  const handleCardClick = (card: AISuggestionCard) => {
    selectCard(card.id, activeShell);
  };

  const handleCopy = async (cmd: string, id: string) => {
    const ok = await copyCommand(cmd);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleInsert = (cmd: string) => {
    insertCommand(cmd, onSelectSuggestion);
  };

  return (
    <div className="p-2.5 flex-1 flex flex-col justify-between overflow-y-auto hide-scrollbar select-none">
      <div>
        {/* Panel Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between cursor-pointer select-none mb-2 group"
        >
          <span className="text-[10px] font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
            <span>AI SUGGESTIONS</span>
          </span>
          <button className="text-white/40 group-hover:text-white transition-colors">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Suggestion Preset Cards */}
        {isOpen && (
          <div className="space-y-2">
            <div className="space-y-1">
              {presetCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className="p-1.5 rounded-md bg-[#0F1019] hover:bg-[#161826] border border-white/5 hover:border-[#00DFFF]/30 text-white/80 hover:text-white text-[10px] font-medium cursor-pointer transition-all duration-200 flex items-center space-x-2 group shadow-sm"
                >
                  <div className="p-0.5 rounded bg-[#EC4899]/10 text-[#EC4899] group-hover:bg-[#00DFFF]/10 group-hover:text-[#00DFFF] transition-colors">
                    <Terminal className="w-3 h-3" />
                  </div>
                  <span className="flex-1 truncate">{card.title}</span>
                </div>
              ))}
            </div>

            {/* Generated AI Suggestion Output View */}
            {aiSuggestions.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/10 space-y-2">
                <div className="text-[9px] font-mono font-bold text-[#00DFFF] flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>AI Generated Suggestions ({activeShell})</span>
                </div>

                <div className="space-y-2">
                  {aiSuggestions.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-[#0C0D14] border border-white/10 hover:border-[#00DFFF]/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-white truncate">{item.title}</span>
                        {item.risk === 'warning' ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-mono flex items-center space-x-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>WARNING</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono flex items-center space-x-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>SAFE</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[9px] text-white/60 font-mono leading-relaxed">{item.description}</p>

                      <div className="p-1.5 rounded bg-black/60 font-mono text-[10px] text-[#00DFFF] border border-white/5 break-all">
                        {item.command}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[8px] font-mono text-white/40 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.estimatedTime}</span>
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleCopy(item.command, item.id)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[9px] flex items-center space-x-1 transition-colors"
                            title="Copy command to clipboard"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleInsert(item.command)}
                            className="px-2 py-0.5 rounded bg-[#EC4899] hover:bg-[#ff2a85] text-white font-mono text-[9px] font-bold flex items-center space-x-1 transition-colors"
                            title="Insert command into prompt (does not execute)"
                          >
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span>Insert</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ask JARVIS anything prompt card */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <button
          onClick={onAskJARVIS}
          className="w-full p-2 rounded-lg bg-gradient-to-r from-[#EC4899]/10 to-[#00DFFF]/10 hover:from-[#EC4899]/20 hover:to-[#00DFFF]/20 border border-white/10 hover:border-[#EC4899]/40 text-left flex items-center space-x-2 transition-all group"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EC4899] group-hover:text-[#00DFFF] transition-colors" />
          <span className="text-[10px] text-white/50 group-hover:text-white/90 font-mono transition-colors">
            Ask JARVIS anything...
          </span>
        </button>
      </div>
    </div>
  );
};
