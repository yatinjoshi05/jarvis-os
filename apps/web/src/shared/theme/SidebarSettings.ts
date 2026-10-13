

export interface SidebarSettingsState {
  itemOrder: string[];                   // Array of item IDs e.g. ['home', 'chat', ...]
  hiddenItems: Record<string, boolean>;  // itemId -> true if hidden
  sidebarWidthPx: number;                // 160 to 260px (default 200)
  iconSizePx: number;                    // 12 to 20px (default 16)
  itemSpacingPx: number;                 // 2 to 8px (default 4)
  textSizeScale: number;                 // 0.7 to 1.3 (default 1.0)
}

const DEFAULT_ORDER = [
  'home', 'mission-control', 'chat', 'missions', 'memory', 'files',
  'terminal', 'browser', 'coding', 'trading', 'crm', 'devices', 'agent-hub',
  'yt-studio', 'instagram', 'facebook', 'settings'
];

type SidebarSettingsListener = (state: SidebarSettingsState) => void;

class SidebarSettingsManager {
  private storageKey = 'jarvis_sidebar_settings';
  private listeners: Set<SidebarSettingsListener> = new Set();

  private state: SidebarSettingsState = {
    itemOrder: [...DEFAULT_ORDER],
    hiddenItems: {},
    sidebarWidthPx: 200,
    iconSizePx: 16,
    itemSpacingPx: 4,
    textSizeScale: 1.0,
  };

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const loadedOrder = Array.isArray(parsed.itemOrder) ? [...parsed.itemOrder] : [...DEFAULT_ORDER];
          
          // Ensure new items (yt-studio, instagram, facebook) are inserted if missing from existing localStorage
          ['yt-studio', 'instagram', 'facebook'].forEach(newItem => {
            if (!loadedOrder.includes(newItem)) {
              const settingsIdx = loadedOrder.indexOf('settings');
              if (settingsIdx !== -1) {
                loadedOrder.splice(settingsIdx, 0, newItem);
              } else {
                loadedOrder.push(newItem);
              }
            }
          });

          this.state = {
            itemOrder: loadedOrder,
            hiddenItems: parsed.hiddenItems || {},
            sidebarWidthPx: typeof parsed.sidebarWidthPx === 'number' ? parsed.sidebarWidthPx : 200,
            iconSizePx: typeof parsed.iconSizePx === 'number' ? parsed.iconSizePx : 16,
            itemSpacingPx: typeof parsed.itemSpacingPx === 'number' ? parsed.itemSpacingPx : 4,
            textSizeScale: typeof parsed.textSizeScale === 'number' ? parsed.textSizeScale : 1.0,
          };
        }
      }
    } catch (_) {}
  }

  private persistSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      }
    } catch (_) {}
  }

  private notify() {
    this.persistSettings();
    const current = this.getState();
    this.listeners.forEach((l) => l(current));
  }

  public hydrate() {
    this.loadPersistedSettings();
    this.notify();
  }

  public getState(): SidebarSettingsState {
    const order = [...this.state.itemOrder];
    DEFAULT_ORDER.forEach((item) => {
      if (!order.includes(item)) {
        const settingsIdx = order.indexOf('settings');
        if (settingsIdx !== -1) {
          order.splice(settingsIdx, 0, item);
        } else {
          order.push(item);
        }
      }
    });

    return {
      ...this.state,
      itemOrder: order,
      hiddenItems: { ...this.state.hiddenItems },
    };
  }

  public subscribe(listener: SidebarSettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateState(partial: Partial<SidebarSettingsState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  public toggleItemVisibility(id: string) {
    this.state.hiddenItems[id] = !this.state.hiddenItems[id];
    this.notify();
  }

  public moveItem(id: string, direction: 'up' | 'down') {
    const idx = this.state.itemOrder.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.state.itemOrder.length) return;

    const newOrder = [...this.state.itemOrder];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);

    this.state.itemOrder = newOrder;
    this.notify();
  }

  public resetToDefault() {
    this.state = {
      itemOrder: [...DEFAULT_ORDER],
      hiddenItems: {},
      sidebarWidthPx: 200,
      iconSizePx: 16,
      itemSpacingPx: 4,
      textSizeScale: 1.0,
    };
    this.notify();
  }
}

export const sidebarSettings = new SidebarSettingsManager();
export default sidebarSettings;
