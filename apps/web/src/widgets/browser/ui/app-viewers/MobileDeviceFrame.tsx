import React from 'react';
import { useAppPreviewStore } from '../../model/useAppPreviewStore';
import { Wifi, Battery, Signal } from 'lucide-react';

export const MobileDeviceFrame: React.FC = () => {
  const { deviceType, orientation, runningPort } = useAppPreviewStore();

  const isPortrait = orientation === 'portrait';
  const isTablet = deviceType === 'tablet';

  const getFrameDimensions = () => {
    if (isTablet) {
      return isPortrait ? 'w-[480px] h-[620px]' : 'w-[620px] h-[480px]';
    }
    return isPortrait ? 'w-[300px] h-[560px]' : 'w-[560px] h-[300px]';
  };

  const appUrl = `http://localhost:${runningPort || 5173}/`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#06070C] p-4 relative select-none overflow-hidden">
      {/* Mobile Device Mockup Container */}
      <div
        className={`${getFrameDimensions()} bg-[#0E101D] border-4 border-[#1E2238] rounded-[36px] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 transform scale-95 shadow-purple-500/10`}
      >
        {/* Top Status Bar & Camera Notch (Only in Portrait) */}
        {isPortrait && (
          <div className="w-full h-6 bg-[#080912] flex items-center justify-between px-5 pt-1 text-[9px] font-mono text-white/70 select-none z-20 shrink-0">
            <span>9:41</span>

            {/* iPhone Camera Pill Notch */}
            <div className="w-20 h-4 bg-black rounded-full mx-auto flex items-center justify-center space-x-1.5 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-[#111] border border-white/10" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#00DFFF]/40" />
            </div>

            <div className="flex items-center space-x-1">
              <Signal className="w-2.5 h-2.5" />
              <Wifi className="w-2.5 h-2.5" />
              <Battery className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        )}

        {/* Dynamic Mobile App Preview Canvas */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0A0B14]">
          <iframe
            src={appUrl}
            title="JARVIS Mobile App Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />

          {/* Render Mobile App UI Canvas Mockup Fallback if iframe loading */}
          <div className="absolute inset-0 bg-[#0A0B14] p-4 flex flex-col justify-between text-white font-sans pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <span className="font-bold text-xs">JARVIS Mobile App</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400">● LIVE</span>
            </div>

            <div className="space-y-2 text-center my-auto">
              <h2 className="text-base font-extrabold tracking-tight">Flutter / React Native Preview</h2>
              <p className="text-[10px] text-white/50">Running on http://localhost:{runningPort}</p>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="flex justify-around border-t border-white/10 pt-2 text-[9px] font-mono text-white/60">
              <span className="text-[#00DFFF] font-bold">Home</span>
              <span>Explore</span>
              <span>Profile</span>
            </div>
          </div>
        </div>

        {/* Bottom iPhone Home Indicator Bar */}
        {isPortrait && (
          <div className="w-full h-4 bg-[#080912] flex items-center justify-center shrink-0">
            <div className="w-28 h-1 bg-white/40 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
