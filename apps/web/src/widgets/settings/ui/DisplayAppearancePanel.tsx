import React, { useState, useEffect } from 'react';
import { Monitor, Sliders, Type, Palette, Maximize2, Check, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff, Layout, Save, Minimize2 } from 'lucide-react';
import {
  displaySettings,
  ACCENT_COLOR_OPTIONS,
  FONT_FAMILY_OPTIONS,
  THEME_PRESETS,
  CategoryTextScales,
} from '../../../shared/theme/DisplaySettings';
import { sidebarSettings } from '../../../shared/theme/SidebarSettings';

export const DisplayAppearancePanel: React.FC = () => {
  const [settings, setSettings] = useState(() => displaySettings.getState());
  const [sbState, setSbState] = useState(() => sidebarSettings.getState());
  const [isTauri, setIsTauri] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  const checkTauriRuntime = () =>
    typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__);

  useEffect(() => {
    setIsTauri(checkTauriRuntime());

    const unsubDisplay = displaySettings.subscribe((updated) => setSettings(updated));
    const unsubSidebar = sidebarSettings.subscribe((updated) => setSbState(updated));
    return () => {
      unsubDisplay();
      unsubSidebar();
    };
  }, []);

  const handleAccentChange = (hex: string, rgb: string) => {
    console.log('[DisplayAppearancePanel] Accent changed:', hex);
    displaySettings.setAccentColor(hex, rgb);
  };

  const handleFontChange = (family: string) => {
    console.log('[DisplayAppearancePanel] Font changed:', family);
    displaySettings.setFontFamily(family);
  };

  const handleZoomChange = (scale: number) => {
    console.log('[DisplayAppearancePanel] Zoom changed:', scale);
    displaySettings.setZoomScale(scale);
  };

  const handleFpsChange = (fps: number) => {
    console.log('[DisplayAppearancePanel] FPS cap changed:', fps);
    displaySettings.setFpsCap(fps);
  };

  const handleBaseTextScaleChange = (scale: number) => {
    console.log('[DisplayAppearancePanel] Base text scale changed:', scale);
    displaySettings.setBaseTextScale(scale);
  };

  const handleCategoryScaleChange = (category: keyof CategoryTextScales, scale: number) => {
    console.log('[DisplayAppearancePanel] Category scale changed:', category, scale);
    displaySettings.setCategoryTextScale(category, scale);
  };

  const handleWindowResize = async (width: number, height: number, maximize = false) => {
    console.log('[DisplayAppearancePanel] Window resize preset clicked:', { width, height, maximize });
    if (checkTauriRuntime()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        if (maximize) {
          await appWindow.maximize();
        } else {
          await appWindow.unmaximize();
          const { LogicalSize } = await import('@tauri-apps/api/dpi');
          await appWindow.setSize(new LogicalSize(width, height));
        }
        return;
      } catch (err) {
        console.warn('[DisplaySettings] Tauri window resize failed:', err);
      }
    }
    if (maximize) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (typeof window !== 'undefined' && window.resizeTo) {
      try { window.resizeTo(width, height); } catch (_) {}
    }
  };

  const handleToggleFullscreen = async () => {
    console.log('[DisplayAppearancePanel] Fullscreen toggle clicked');
    if (checkTauriRuntime()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        const currentFs = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!currentFs);
        setIsFullscreen(!currentFs);
        return;
      } catch (err) {
        console.warn('[DisplaySettings] Native Tauri fullscreen toggle failed, falling back to HTML5:', err);
      }
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleApply = async () => {
    console.log('[DisplayAppearancePanel] Apply Display Settings clicked');
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      const ok = await displaySettings.saveToDurableBackend();
      displaySettings.applyCssVariables();
      if (ok) {
        setApplyFeedback('✓ DISPLAY SETTINGS APPLIED & PERSISTED TO BACKEND');
      } else {
        setApplyFeedback('✓ DISPLAY SETTINGS APPLIED LOCALLY');
      }
      setTimeout(() => setApplyFeedback(null), 3000);
    } catch (err: any) {
      setApplyFeedback(`ERROR: ${err?.message || 'SAVE FAILED'}`);
      setTimeout(() => setApplyFeedback(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  const CATEGORY_CONFIGS: { key: keyof CategoryTextScales; label: string; desc: string }[] = [
    { key: 'sidebarTextScale', label: 'Sidebar Items & Badges', desc: 'Navigation labels, status tags, icons' },
    { key: 'titleTextScale', label: 'Page Titles & Headers', desc: 'Workspace titles, section headers' },
    { key: 'bodyTextScale', label: 'Body Text & Paragraphs', desc: 'Standard content descriptions & code text' },
    { key: 'chartTextScale', label: 'Data & Chart Labels', desc: 'Financial tickers, chart axes, order books' },
    { key: 'buttonTextScale', label: 'Buttons & Controls', desc: 'Action buttons, dropdowns, inputs' },
    { key: 'chatTextScale', label: 'Chat Message Bubbles', desc: 'User & Assistant conversational text' },
  ];

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-5 space-y-6 font-mono select-none text-left relative z-10">
      {/* PANEL HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Monitor size={16} className="text-[#00FFCC]" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Display, Appearance &amp; Typography Control Center
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {applyFeedback && (
            <span className="text-[8.5px] font-bold text-[#00FFCC] border border-[#00FFCC]/30 bg-[#00FFCC]/10 px-2 py-0.5 rounded flex items-center space-x-1 uppercase">
              <Check size={9} />
              <span>{applyFeedback}</span>
            </span>
          )}
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-3 py-1.5 bg-[#00FFCC] hover:bg-[#00D6AB] text-black rounded-lg text-[9px] font-bold uppercase transition-all flex items-center space-x-1.5 shadow-lg shadow-[#00FFCC]/20 disabled:opacity-50"
          >
            <Save size={11} />
            <span>{isApplying ? 'APPLYING...' : 'APPLY DISPLAY SETTINGS'}</span>
          </button>
        </div>
      </div>

      {/* RESOLUTION, UI SCALE & NATIVE FULLSCREEN */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2">
            <Maximize2 size={13} className="text-[#00DFFF]" />
            <span className="text-[10px] font-black text-white uppercase">Resolution, UI Zoom &amp; Window Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFullscreen}
              className={`px-2.5 py-1 rounded text-[8.5px] font-bold uppercase border transition-all flex items-center space-x-1 ${
                isFullscreen
                  ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/40'
                  : 'bg-[#00DFFF]/10 text-[#00DFFF] border-[#00DFFF]/30 hover:bg-[#00DFFF]/20'
              }`}
            >
              {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
              <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'WINDOW FULLSCREEN'}</span>
            </button>
            <span className="text-xs font-mono font-bold text-[#00DFFF]">
              {Math.round(settings.zoomScale * 100)}% ZOOM
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[8px] text-white/60 uppercase font-bold">
            <span>UI Scale Factor (Live Cascading DOM Zoom)</span>
            <span>80% - 150%</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.05}
            value={settings.zoomScale}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-full accent-[#00DFFF]"
          />
        </div>

        {/* DESKTOP & VIEWPORT WINDOW PRESETS */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-white/50 uppercase">Desktop &amp; Viewport Window Size Presets</span>
            <span className="text-[7.5px] text-[#00DFFF] font-mono font-bold">
              {isTauri ? 'TAURI NATIVE OS WINDOW API' : 'WEB VIEWPORT ADAPTER'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1280 × 720 (HD)', w: 1280, h: 720 },
              { label: '1600 × 900 (HD+)', w: 1600, h: 900 },
              { label: '1920 × 1080 (FHD)', w: 1920, h: 1080 },
              { label: 'Maximized Window', w: 0, h: 0, max: true },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleWindowResize(preset.w, preset.h, preset.max)}
                className="p-2 rounded-lg border border-white/10 bg-black/80 hover:border-[#00DFFF] hover:text-[#00DFFF] active:bg-[#00DFFF]/20 text-[8.5px] font-bold uppercase transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ANIMATION RENDER FPS CAP */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Sliders size={13} className="text-[#F59E0B]" />
          <span className="text-[10px] font-black text-white uppercase">Animation &amp; Canvas FPS Render Cap</span>
        </div>
        <p className="text-[8px] text-white/50 leading-relaxed">
          Throttle continuous background canvas animations (ambient audio orb visualizer &amp; particle loops) to save CPU/GPU cycles.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '30 FPS (Power Saver)', value: 30 },
            { label: '60 FPS (Balanced)', value: 60 },
            { label: '120 FPS (High Refresh)', value: 120 },
            { label: 'Unlimited (Max Performance)', value: 0 },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => handleFpsChange(f.value)}
              className={`p-2.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                settings.fpsCap === f.value
                  ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B] font-black'
                  : 'border-white/10 bg-black/50 text-white/50 hover:text-white hover:border-white/20 text-xs'
              }`}
            >
              <span className="text-[9px] uppercase font-bold">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GLOBAL FONT FAMILY (20 REAL FONTS) */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2">
            <Type size={13} className="text-[#00FFCC]" />
            <span className="text-[10px] font-black text-white uppercase">Global Application Font Family (20 Distinct Loaded Fonts)</span>
          </div>
          <span className="text-[8px] font-mono text-[#00FFCC]">ACTIVE: {settings.fontFamily.split(',')[0]}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto hide-scrollbar pr-1">
          {FONT_FAMILY_OPTIONS.map((f) => {
            const isSelected = settings.fontFamily === f.family;
            return (
              <button
                key={f.id}
                onClick={() => handleFontChange(f.family)}
                style={{ fontFamily: f.family }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-[#00FFCC] bg-[#00FFCC]/10 text-[#00FFCC] shadow-md'
                    : 'border-white/10 bg-black/50 text-white/70 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-[11px] font-medium truncate">{f.label}</span>
                {isSelected && <Check size={14} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* THEME & ACCENT COLOR */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Palette size={13} className="text-[#FF00FF]" />
          <span className="text-[10px] font-black text-white uppercase">Theme &amp; Accent Color Palette</span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[8px] font-bold text-white/50 uppercase">Accent Highlight Color</span>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ACCENT_COLOR_OPTIONS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => handleAccentChange(acc.hex, acc.rgb)}
                className={`p-2 rounded-lg border flex items-center space-x-2 transition-all ${
                  settings.accentColor === acc.hex
                    ? 'border-white shadow-lg bg-white/10'
                    : 'border-white/10 bg-black/40 hover:border-white/30'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ background: acc.hex }} />
                <span className="text-[8px] font-bold uppercase truncate" style={{ color: acc.hex }}>
                  {acc.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-[8px] font-bold text-white/50 uppercase">Theme Style Preset</span>
          <div className="grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((t) => (
              <button
                key={t.id}
                onClick={() => displaySettings.updateState({ themeId: t.id as any })}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  settings.themeId === t.id
                    ? 'border-[#FF00FF] bg-[#FF00FF]/10 text-[#FF00FF]'
                    : 'border-white/10 bg-black/50 text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: t.bgMain }} />
                  <span className="text-[9px] font-bold uppercase">{t.label}</span>
                </div>
                {settings.themeId === t.id && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BASE TEXT SIZE */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
          <span className="text-white font-black">Global Base Text Scale (HTML Rem Factor)</span>
          <span className="text-[#00FFCC]">{Math.round(settings.baseTextScale * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.05}
          value={settings.baseTextScale}
          onChange={(e) => handleBaseTextScaleChange(parseFloat(e.target.value))}
          className="w-full accent-[#00FFCC]"
        />
      </div>

      {/* LAYER 3 — LEFT SIDEBAR CUSTOMIZATION */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2">
            <Layout size={14} className="text-[#00DFFF]" />
            <span className="text-[10px] font-black text-white uppercase">
              Layer 3 — Left Sidebar Customization
            </span>
          </div>
          <button
            onClick={() => sidebarSettings.resetToDefault()}
            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-white/60 hover:text-white uppercase"
          >
            Reset Sidebar
          </button>
        </div>

        {/* Sidebar Width Control */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-bold uppercase">
            <span className="text-white/80">Sidebar Panel Width</span>
            <span className="text-[#00DFFF]">{sbState.sidebarWidthPx}px</span>
          </div>
          <input
            type="range"
            min={160}
            max={260}
            step={5}
            value={sbState.sidebarWidthPx}
            onChange={(e) => sidebarSettings.updateState({ sidebarWidthPx: parseInt(e.target.value, 10) })}
            className="w-full accent-[#00DFFF]"
          />
        </div>

        {/* Sidebar Item Reordering & Visibility */}
        <div className="space-y-2 pt-1">
          <span className="text-[8px] font-bold text-white/50 uppercase">Navigation Items Order &amp; Visibility</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sbState.itemOrder.map((itemId, idx) => {
              const isHidden = !!sbState.hiddenItems[itemId];
              return (
                <div
                  key={itemId}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                    isHidden
                      ? 'bg-black/20 border-white/5 opacity-50'
                      : 'bg-black/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[8px] font-mono text-[#00DFFF]">#{idx + 1}</span>
                    <span className="text-[9px] font-bold uppercase text-white">{itemId}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => sidebarSettings.moveItem(itemId, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:text-[#00DFFF] disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={10} />
                    </button>
                    <button
                      onClick={() => sidebarSettings.moveItem(itemId, 'down')}
                      disabled={idx === sbState.itemOrder.length - 1}
                      className="p-1 hover:text-[#00DFFF] disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={10} />
                    </button>
                    <button
                      onClick={() => sidebarSettings.toggleItemVisibility(itemId)}
                      className={`p-1 rounded border text-[8px] ${
                        isHidden
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                      title={isHidden ? 'Show in Sidebar' : 'Hide from Sidebar'}
                    >
                      {isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LAYER 4 — CONSOLIDATED TYPOGRAPHY CONTROL CENTER */}
      <div className="border border-[#00FFCC]/30 rounded-xl bg-black/80 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <div className="flex items-center space-x-2">
            <Type size={14} className="text-[#00FFCC]" />
            <span className="text-[10px] font-black text-[#00FFCC] uppercase">
              Layer 4 — Consolidated Typography Control Center
            </span>
          </div>
          <button
            onClick={() => {
              displaySettings.updateState({
                categoryScales: {
                  sidebarTextScale: 1.0,
                  titleTextScale: 1.0,
                  bodyTextScale: 1.0,
                  chartTextScale: 1.0,
                  buttonTextScale: 1.0,
                  chatTextScale: 1.0,
                },
              });
            }}
            className="px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20 text-[8px] text-white/70 flex items-center space-x-1 uppercase"
          >
            <RefreshCw size={10} />
            <span>Reset Typography</span>
          </button>
        </div>

        <p className="text-[8px] text-white/50 leading-relaxed">
          Fine-tune text scaling per category across all workspaces simultaneously from one central list.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CATEGORY_CONFIGS.map((cat) => {
            const scaleVal = settings.categoryScales[cat.key] ?? 1.0;
            return (
              <div key={cat.key} className="bg-black/60 border border-white/10 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-white uppercase">{cat.label}</span>
                    <p className="text-[7px] text-white/40">{cat.desc}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#00FFCC]">{Math.round(scaleVal * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.05}
                  value={scaleVal}
                  onChange={(e) => handleCategoryScaleChange(cat.key, parseFloat(e.target.value))}
                  className="w-full accent-[#00FFCC]"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DisplayAppearancePanel;
