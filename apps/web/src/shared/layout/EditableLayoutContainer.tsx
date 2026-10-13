import React from 'react';
import { Move, Eye, EyeOff, Type, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { LayoutElementConfig } from './useEditableLayout';

interface EditableLayoutContainerProps {
  config: LayoutElementConfig;
  isEditMode: boolean;
  onUpdate: (partial: Partial<LayoutElementConfig>) => void;
  children: React.ReactNode;
}

export const EditableLayoutContainer: React.FC<EditableLayoutContainerProps> = ({
  config,
  isEditMode,
  onUpdate,
  children,
}) => {
  if (!config.visible && !isEditMode) {
    return null;
  }

  const opacityStyle = { opacity: config.visible ? config.opacity : 0.25 };
  const fontStyle = { fontSize: `${config.fontSizeScale * 100}%` };

  return (
    <div
      className={`relative transition-all duration-200 select-none ${
        isEditMode
          ? 'border-2 border-dashed border-[#00FFCC] bg-[#00FFCC]/5 rounded-2xl p-2.5 shadow-xl shadow-[#00FFCC]/10 z-30'
          : ''
      }`}
      style={{
        ...opacityStyle,
        ...fontStyle,
      }}
    >
      {/* EDIT MODE OVERLAY HEADER & TOOLBAR */}
      {isEditMode && (
        <div className="w-full bg-black/90 border border-[#00FFCC]/40 rounded-xl p-2.5 mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-white shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-[#00FFCC] text-black font-black text-[9.5px]">
              #{config.order + 1}
            </span>
            <div className="flex items-center space-x-1 font-black text-[#00FFCC] uppercase">
              <Move size={11} />
              <span>{config.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Opacity Slider */}
            <div className="flex items-center space-x-1.5 bg-black/60 px-2 py-1 rounded border border-white/10">
              <Sliders size={10} className="text-[#00DFFF]" />
              <span className="text-[8px] text-white/50">Opacity:</span>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={config.opacity}
                onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                className="w-14 accent-[#00DFFF]"
              />
              <span className="text-[8.5px] font-bold text-[#00DFFF]">{Math.round(config.opacity * 100)}%</span>
            </div>

            {/* Font Scale Slider */}
            <div className="flex items-center space-x-1.5 bg-black/60 px-2 py-1 rounded border border-white/10">
              <Type size={10} className="text-[#FF00FF]" />
              <span className="text-[8px] text-white/50">Font:</span>
              <input
                type="range"
                min={0.7}
                max={1.4}
                step={0.05}
                value={config.fontSizeScale}
                onChange={(e) => onUpdate({ fontSizeScale: parseFloat(e.target.value) })}
                className="w-14 accent-[#FF00FF]"
              />
              <span className="text-[8.5px] font-bold text-[#FF00FF]">{Math.round(config.fontSizeScale * 100)}%</span>
            </div>

            {/* Width Ratio Selector */}
            <div className="flex items-center space-x-1 bg-black/60 px-2 py-1 rounded border border-white/10">
              <span className="text-[8px] text-white/50 pr-1">Width:</span>
              {[
                { label: '50%', ratio: 0.5 },
                { label: '100%', ratio: 1.0 },
              ].map((w) => (
                <button
                  key={w.label}
                  onClick={() => onUpdate({ widthRatio: w.ratio })}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    config.widthRatio === w.ratio
                      ? 'bg-[#00FFCC] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Height Adjustment */}
            <div className="flex items-center space-x-1 bg-black/60 px-2 py-1 rounded border border-white/10">
              <button
                onClick={() => onUpdate({ heightPx: Math.max(150, config.heightPx - 50) })}
                className="p-1 hover:text-[#00FFCC]"
                title="Decrease Height"
              >
                <Minimize2 size={10} />
              </button>
              <span className="text-[8px] font-bold text-white/70">{config.heightPx}px</span>
              <button
                onClick={() => onUpdate({ heightPx: config.heightPx + 50 })}
                className="p-1 hover:text-[#00FFCC]"
                title="Increase Height"
              >
                <Maximize2 size={10} />
              </button>
            </div>

            {/* Visibility Toggle */}
            <button
              onClick={() => onUpdate({ visible: !config.visible })}
              className={`px-2 py-1 rounded border text-[8.5px] font-bold flex items-center space-x-1 uppercase ${
                config.visible
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {config.visible ? <Eye size={10} /> : <EyeOff size={10} />}
              <span>{config.visible ? 'VISIBLE' : 'HIDDEN'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PANEL CONTENT */}
      {config.visible ? children : isEditMode ? (
        <div className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-mono">
          ⚠️ Panel "{config.label}" is currently HIDDEN. Click VISIBLE above to restore.
        </div>
      ) : null}
    </div>
  );
};
