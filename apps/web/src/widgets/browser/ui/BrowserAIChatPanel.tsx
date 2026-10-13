import React from 'react';
import {
  MoreHorizontal,
  FileCode,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Download,
  Copy,
  Paperclip,
  Send,
  Activity,
} from 'lucide-react';
import { useAppPreviewStore } from '../model/useAppPreviewStore';

export const BrowserAIChatPanel: React.FC = () => {
  const { inspectorData } = useAppPreviewStore();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07080E] text-white font-sans select-none overflow-hidden rounded-lg border border-white/10 shadow-2xl">
      {/* 1. Header Bar (Scaled Down) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0A0B12] border-b border-white/10">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black tracking-widest text-[#EC4899] uppercase font-mono">
            AI ASSISTANT
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#0E1524] border border-emerald-500/30 text-[9px] font-mono text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>JARVIS ACTIVE</span>
          </div>
          <button className="text-white/40 hover:text-white transition-colors p-0.5">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Chat Conversation Area (Scaled Down & Hidden Scrollbars) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-[11px] hide-scrollbar">
        {/* User Prompt Message Bubble (Right Aligned) */}
        <div className="flex flex-col items-end space-y-0.5">
          <div className="max-w-[88%] p-2.5 rounded-xl bg-[#141726] border border-white/10 text-white/90 text-[10px] leading-relaxed shadow-md">
            Create a modern AI landing page with dark theme, gradient colors and a dashboard preview section.
          </div>
          <span className="text-[8px] font-mono text-white/40 pr-0.5">12:24 PM</span>
        </div>

        {/* JARVIS Assistant Response Message Card (Left Aligned) */}
        <div className="flex flex-col items-start space-y-0.5 w-full">
          <div className="w-full p-3 rounded-xl bg-[#0D0F1B] border border-white/10 space-y-3 shadow-lg">
            {/* Avatar Header */}
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-[9px] text-white shadow-sm">
                N
              </div>
              <span className="font-extrabold text-[11px] tracking-wide">JARVIS</span>
            </div>

            {/* Response Description Text */}
            <p className="text-[10px] text-white/80 leading-relaxed">
              I've created a modern AI landing page with a dark theme, gradient colors and a dashboard preview section. Preview is shown in the browser.
            </p>

            {/* Project Intelligence Inspector Card */}
            <div className="p-2.5 rounded-lg bg-[#080A14] border border-white/10 space-y-2 font-mono text-[9.5px]">
              <div className="flex items-center justify-between text-[#00DFFF] font-bold tracking-wide uppercase border-b border-white/5 pb-1">
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-[#00DFFF]" />
                  <span>PROJECT INTELLIGENCE</span>
                </div>
                <span className="text-emerald-400 text-[8.5px]">● {inspectorData.status.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-white/80">
                <div>
                  <span className="text-white/40 block text-[8px]">FRAMEWORK:</span>
                  <span className="font-semibold text-white truncate block">{inspectorData.framework}</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[8px]">PORT / TARGET:</span>
                  <span className="font-semibold text-[#00DFFF] block">:{inspectorData.port}</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[8px]">ENTRY POINT:</span>
                  <span className="text-white/70 truncate block">{inspectorData.entryFile}</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[8px]">DEPENDENCIES:</span>
                  <span className="text-white/70 block">{inspectorData.dependenciesCount} modules</span>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-end space-x-1 text-[8px] font-mono text-white/40">
              <span>12:28 PM</span>
              <CheckCircle2 className="w-2.5 h-2.5 text-[#EC4899]" />
            </div>

            {/* FILES CREATED Box */}
            <div className="pt-1.5 border-t border-white/10 space-y-1.5">
              <span className="text-[9px] font-bold font-mono text-[#00DFFF] tracking-wider uppercase block">
                FILES CREATED
              </span>

              <div className="space-y-1 bg-[#080912] p-2 rounded-lg border border-white/5 font-mono text-[10px]">
                {/* index.html */}
                <div className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <FileCode className="w-3 h-3 text-orange-400" />
                    <span className="text-white/90">index.html</span>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>

                {/* styles.css */}
                <div className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span className="text-white/90">styles.css</span>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>

                {/* script.js */}
                <div className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-3 h-3 text-yellow-400" />
                    <span className="text-white/90">script.js</span>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>

                {/* assets/hero-bg.png */}
                <div className="flex items-center justify-between p-1 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <ImageIcon className="w-3 h-3 text-purple-400" />
                    <span className="text-white/90">assets/hero-bg.png</span>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* ACTIONS Row */}
            <div className="pt-1.5 border-t border-white/10 space-y-1.5">
              <span className="text-[9px] font-bold font-mono text-[#00DFFF] tracking-wider uppercase block">
                ACTIONS
              </span>

              <div className="flex flex-wrap gap-1.5">
                <button className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-[9px] font-mono font-medium flex items-center space-x-1 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5 text-[#00DFFF]" />
                  <span>Open in New Tab</span>
                </button>

                <button className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-[9px] font-mono font-medium flex items-center space-x-1 transition-colors">
                  <Download className="w-2.5 h-2.5 text-purple-400" />
                  <span>Download Code</span>
                </button>

                <button className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-[9px] font-mono font-medium flex items-center space-x-1 transition-colors">
                  <Copy className="w-2.5 h-2.5 text-pink-400" />
                  <span>Copy Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Prompt Input Container (Scaled Down) */}
      <div className="p-2 bg-[#0A0B12] border-t border-white/10 select-none">
        <div className="relative flex items-center px-2.5 py-1.5 rounded-lg bg-[#111320] border border-white/10 focus-within:border-[#EC4899]/50 transition-colors shadow-inner">
          <button className="text-white/40 hover:text-white transition-colors mr-1.5">
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            placeholder="Ask JARVIS to create, modify or preview anything..."
            className="flex-1 bg-transparent text-[10px] font-sans text-white placeholder:text-white/30 focus:outline-none"
          />

          <button className="p-1.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] hover:from-[#ff2a85] hover:to-[#9a65ff] text-white shadow-md shadow-pink-500/20 transition-all transform hover:scale-105 active:scale-95 ml-1.5">
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
