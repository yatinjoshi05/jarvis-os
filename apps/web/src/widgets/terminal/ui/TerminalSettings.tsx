import React from 'react';
import { X, Sliders, Palette } from 'lucide-react';

interface TerminalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  opacity: number;
  setOpacity: (op: number) => void;
}

export const TerminalSettings: React.FC<TerminalSettingsProps> = ({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  opacity,
  setOpacity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0D0E15] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-6 font-mono text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2 text-[#00DFFF]">
            <Sliders className="w-5 h-5" />
            <h3 className="text-base font-bold uppercase tracking-wider">Terminal Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Font Size ({fontSize}px)</span>
            </div>
            <input
              type="range"
              min={11}
              max={18}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[#00DFFF] cursor-pointer"
            />
          </div>

          {/* Background Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Glass Opacity ({opacity}%)</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-[#EC4899] cursor-pointer"
            />
          </div>

          {/* Theme Preset */}
          <div className="space-y-2 pt-2">
            <span className="text-white/70 flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-[#00DFFF]" />
              <span>Theme Preset</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 px-3 rounded bg-[#00DFFF]/10 border border-[#00DFFF] text-[#00DFFF] font-semibold text-center">
                Cyberpunk Dark
              </button>
              <button className="py-2 px-3 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white text-center">
                PowerShell Classic
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00DFFF] to-[#EC4899] text-black font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
