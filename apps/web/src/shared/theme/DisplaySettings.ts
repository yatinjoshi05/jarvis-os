/**
 * DisplaySettings.ts
 * Central Display & Appearance Manager for JARVIS OS.
 * Manages global CSS variables (Accent Color, Font Family, Base Text Size, UI Zoom Scale),
 * FPS animation caps, theme presets, and consolidated typography scales across 6 categories.
 * Synchronizes with durable settings store.
 */

export interface CategoryTextScales {
  sidebarTextScale: number; // 0.7 to 1.4
  titleTextScale: number;   // 0.7 to 1.4
  bodyTextScale: number;    // 0.7 to 1.4
  chartTextScale: number;   // 0.7 to 1.4
  buttonTextScale: number;  // 0.7 to 1.4
  chatTextScale: number;    // 0.7 to 1.4
}

export interface DisplaySettingsState {
  zoomScale: number;           // 0.8 to 1.5 (CSS zoom / transform scale)
  fpsCap: number;              // 30, 60, 120, or 0 (unlimited)
  fontFamily: string;          // CSS font family string
  accentColor: string;         // Hex code e.g. #00FFCC
  accentRgb: string;           // RGB tuple e.g. '0, 255, 204'
  themeId: 'cyber_dark' | 'midnight_blue' | 'oled_black' | 'synthwave';
  baseTextScale: number;       // 0.8 to 1.4 (root font multiplier)
  categoryScales: CategoryTextScales;
}

export const ACCENT_COLOR_OPTIONS = [
  { id: 'cyan', label: 'Cyber Cyan', hex: '#00FFCC', rgb: '0, 255, 204' },
  { id: 'magenta', label: 'Neon Magenta', hex: '#FF00FF', rgb: '255, 0, 255' },
  { id: 'blue', label: 'Electric Blue', hex: '#00DFFF', rgb: '0, 223, 255' },
  { id: 'gold', label: 'Amber Gold', hex: '#F59E0B', rgb: '245, 158, 11' },
  { id: 'emerald', label: 'Emerald Matrix', hex: '#10B981', rgb: '16, 185, 129' },
  { id: 'crimson', label: 'Crimson Fury', hex: '#FF0055', rgb: '255, 0, 85' },
];

export const FONT_FAMILY_OPTIONS = [
  { id: 'jetbrains', label: 'JetBrains Mono (Default)', family: "'JetBrains Mono', monospace" },
  { id: 'fira_code', label: 'Fira Code (Ligatures)', family: "'Fira Code', monospace" },
  { id: 'roboto_mono', label: 'Roboto Mono (Google)', family: "'Roboto Mono', monospace" },
  { id: 'ibm_plex_mono', label: 'IBM Plex Mono (Corporate)', family: "'IBM Plex Mono', monospace" },
  { id: 'source_code_pro', label: 'Source Code Pro (Adobe)', family: "'Source Code Pro', monospace" },
  { id: 'space_mono', label: 'Space Mono (Futuristic)', family: "'Space Mono', monospace" },
  { id: 'share_tech_mono', label: 'Share Tech Mono (Tactical)', family: "'Share Tech Mono', monospace" },
  { id: 'anonymous_pro', label: 'Anonymous Pro (Hacker)', family: "'Anonymous Pro', monospace" },
  { id: 'vt323', label: 'VT323 (Retro Terminal)', family: "'VT323', monospace" },
  { id: 'press_start_2p', label: 'Press Start 2P (Pixel Arcade)', family: "'Press Start 2P', monospace" },
  { id: 'inter', label: 'Inter Modern (Clean Sans)', family: "'Inter', sans-serif" },
  { id: 'outfit', label: 'Outfit Clean (Geometric)', family: "'Outfit', sans-serif" },
  { id: 'roboto', label: 'Roboto Standard (Android)', family: "'Roboto', sans-serif" },
  { id: 'syne', label: 'Syne Avant-Garde (Sleek)', family: "'Syne', sans-serif" },
  { id: 'orbitron', label: 'Orbitron Sci-Fi (Command)', family: "'Orbitron', sans-serif" },
  { id: 'rajdhani', label: 'Rajdhani Tactical (Display)', family: "'Rajdhani', sans-serif" },
  { id: 'audiowide', label: 'Audiowide Cyberpunk (Heavy)', family: "'Audiowide', display" },
  { id: 'chakra_petch', label: 'Chakra Petch HUD (Tech)', family: "'Chakra Petch', sans-serif" },
  { id: 'oxanium', label: 'Oxanium High-Tech (Angular)', family: "'Oxanium', display" },
  { id: 'share_tech', label: 'Share Tech Industrial (Minimal)', family: "'Share Tech', sans-serif" },
];

export const THEME_PRESETS = [
  { id: 'cyber_dark', label: 'Cyber Dark (Default)', bgMain: '#090d16', bgCard: '#0d1322', border: 'rgba(255, 255, 255, 0.1)' },
  { id: 'midnight_blue', label: 'Midnight Ocean', bgMain: '#061126', bgCard: '#0a1a3a', border: 'rgba(0, 223, 255, 0.15)' },
  { id: 'oled_black', label: 'Deep OLED Black', bgMain: '#000000', bgCard: '#050505', border: 'rgba(255, 255, 255, 0.08)' },
  { id: 'synthwave', label: 'Neon Synthwave', bgMain: '#130424', bgCard: '#1f083a', border: 'rgba(255, 0, 255, 0.2)' },
];

type DisplaySettingsListener = (state: DisplaySettingsState) => void;

class DisplaySettingsManager {
  private storageKey = 'jarvis_display_settings';
  private listeners: Set<DisplaySettingsListener> = new Set();

  private state: DisplaySettingsState = {
    zoomScale: 1.0,
    fpsCap: 60,
    fontFamily: FONT_FAMILY_OPTIONS[0].family,
    accentColor: '#00FFCC',
    accentRgb: '0, 255, 204',
    themeId: 'cyber_dark',
    baseTextScale: 1.0,
    categoryScales: {
      sidebarTextScale: 1.0,
      titleTextScale: 1.0,
      bodyTextScale: 1.0,
      chartTextScale: 1.0,
      buttonTextScale: 1.0,
      chatTextScale: 1.0,
    },
  };

  constructor() {
    // NOTE: Do NOT call loadPersistedSettings() here.
    // The storageShim (which overwrites window.localStorage with the Tauri-backed
    // persistent store) is installed asynchronously in initAndMount() AFTER all
    // module-level imports resolve. Reading localStorage here would hit the raw
    // browser/WebView ephemeral storage instead of the durable Tauri store.
    // Call displaySettings.hydrate() explicitly after initLocalStorageShim() completes.
    this.applyCssVariables(); // Apply defaults immediately so there's no unstyled flash
  }

  /**
   * Hydrates DisplaySettings from the (now shim-backed) localStorage.
   * Must be called after initLocalStorageShim() has completed.
   */
  public hydrate(): void {
    this.loadPersistedSettings();
    this.applyCssVariables();
    if (import.meta.env.DEV) {
      console.log('[DisplaySettings] Hydrated from localStorage (shim-backed):', JSON.stringify(this.getState()));
    }
  }

  private loadPersistedSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          this.state = {
            zoomScale: typeof parsed.zoomScale === 'number' ? parsed.zoomScale : 1.0,
            fpsCap: typeof parsed.fpsCap === 'number' ? parsed.fpsCap : 60,
            fontFamily: typeof parsed.fontFamily === 'string' ? parsed.fontFamily : FONT_FAMILY_OPTIONS[0].family,
            accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : '#00FFCC',
            accentRgb: typeof parsed.accentRgb === 'string' ? parsed.accentRgb : '0, 255, 204',
            themeId: parsed.themeId || 'cyber_dark',
            baseTextScale: typeof parsed.baseTextScale === 'number' ? parsed.baseTextScale : 1.0,
            categoryScales: {
              sidebarTextScale: parsed.categoryScales?.sidebarTextScale ?? 1.0,
              titleTextScale: parsed.categoryScales?.titleTextScale ?? 1.0,
              bodyTextScale: parsed.categoryScales?.bodyTextScale ?? 1.0,
              chartTextScale: parsed.categoryScales?.chartTextScale ?? 1.0,
              buttonTextScale: parsed.categoryScales?.buttonTextScale ?? 1.0,
              chatTextScale: parsed.categoryScales?.chatTextScale ?? 1.0,
            },
          };
        } else if (import.meta.env.DEV) {
          console.log('[DisplaySettings] No persisted data found at key:', this.storageKey, '— using defaults.');
        }
      }
    } catch (err) {
      console.warn('[DisplaySettings] Failed to read persisted settings; using defaults:', err);
    }
  }

  private persistSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      }
    } catch (_) {
      // Ignore write errors
    }
  }

  public async saveToDurableBackend(): Promise<boolean> {
    // Always persist to localStorage (shim-backed → Tauri store) first.
    this.persistSettings();
    this.applyCssVariables();
    // The storageShim's setItem already auto-syncs to the backend durable store
    // via its debounced POST /api/settings/save with `{ settings: storageData }`.
    // This explicit backend call is a belt-and-suspenders flush for immediate confirmation.
    try {
      const response = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use key 'settings' — NOT 'displaySettings' — to match what the backend
        // handler extracts: `payload.settings ? payload.settings : payload`
        body: JSON.stringify({
          settings: { [this.storageKey]: JSON.stringify(this.state) },
        }),
      });
      if (response.ok) {
        if (import.meta.env.DEV) {
          console.log('[DisplaySettings] Persisted to durable backend (belt-and-suspenders flush).');
        }
        return true;
      }
    } catch (err) {
      console.warn('[DisplaySettings] Durable backend explicit flush failed (localStorage shim will still sync):', err);
    }
    return true; // localStorage is authoritative — report success regardless
  }

  public applyCssVariables() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--jarvis-accent-color', this.state.accentColor);
    root.style.setProperty('--jarvis-accent-rgb', this.state.accentRgb);
    root.style.setProperty('--jarvis-font-family', this.state.fontFamily);
    root.style.setProperty('--jarvis-base-text-scale', `${this.state.baseTextScale}`);
    root.style.setProperty('--jarvis-zoom-scale', `${this.state.zoomScale}`);

    // Category typography scales
    root.style.setProperty('--jarvis-scale-sidebar', `${this.state.categoryScales.sidebarTextScale}`);
    root.style.setProperty('--jarvis-scale-title', `${this.state.categoryScales.titleTextScale}`);
    root.style.setProperty('--jarvis-scale-body', `${this.state.categoryScales.bodyTextScale}`);
    root.style.setProperty('--jarvis-scale-chart', `${this.state.categoryScales.chartTextScale}`);
    root.style.setProperty('--jarvis-scale-button', `${this.state.categoryScales.buttonTextScale}`);
    root.style.setProperty('--jarvis-scale-chat', `${this.state.categoryScales.chatTextScale}`);

    // Theme preset colors
    const themePreset = THEME_PRESETS.find((t) => t.id === this.state.themeId) || THEME_PRESETS[0];
    root.style.setProperty('--jarvis-bg-main', themePreset.bgMain);
    root.style.setProperty('--jarvis-bg-card', themePreset.bgCard);
    root.style.setProperty('--jarvis-border-color', themePreset.border);

    // Document theme class
    root.className = `theme-${this.state.themeId}`;

    // Apply font family directly to body & root for instant cascading
    document.body.style.fontFamily = this.state.fontFamily;
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.fontFamily = this.state.fontFamily;
    }
  }

  private notify() {
    this.applyCssVariables();
    this.persistSettings();
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[DisplaySettings] Listener error:', err);
      }
    });
  }

  public getState(): DisplaySettingsState {
    return {
      ...this.state,
      categoryScales: { ...this.state.categoryScales },
    };
  }

  public subscribe(listener: DisplaySettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateState(partial: Partial<DisplaySettingsState>) {
    this.state = {
      ...this.state,
      ...partial,
      categoryScales: {
        ...this.state.categoryScales,
        ...(partial.categoryScales || {}),
      },
    };
    this.notify();
  }

  public setAccentColor(hex: string, rgb: string) {
    this.state.accentColor = hex;
    this.state.accentRgb = rgb;
    this.notify();
  }

  public setFontFamily(family: string) {
    this.state.fontFamily = family;
    this.notify();
  }

  public setZoomScale(scale: number) {
    this.state.zoomScale = Math.max(0.7, Math.min(1.5, scale));
    this.notify();
  }

  public setFpsCap(fps: number) {
    this.state.fpsCap = fps;
    this.notify();
  }

  public setBaseTextScale(scale: number) {
    this.state.baseTextScale = Math.max(0.7, Math.min(1.5, scale));
    this.notify();
  }

  public setCategoryTextScale(category: keyof CategoryTextScales, scale: number) {
    this.state.categoryScales[category] = Math.max(0.7, Math.min(1.5, scale));
    this.notify();
  }
}

export const displaySettings = new DisplaySettingsManager();
export default displaySettings;
