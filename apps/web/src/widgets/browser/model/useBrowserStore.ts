import { create } from 'zustand';

export type PreviewMode = 'website' | 'react' | 'html' | 'generated';
export type ProjectType = 'react' | 'html' | 'vite' | 'next' | 'static';
export type PreviewStatus = 'loading' | 'compiling' | 'ready' | 'reloading' | 'offline' | 'error';

export interface BrowserTabItem {
  id: string;
  name: string;
  url: string;
  mode: PreviewMode;
  projectType: ProjectType;
  htmlContent?: string;
}

interface BrowserState {
  rightPanelWidth: number;
  activeUrl: string;
  activeTab: string;
  activeTabId: string;
  tabs: BrowserTabItem[];
  isLive: boolean;

  currentMode: PreviewMode;
  projectType: ProjectType;
  loading: boolean;
  previewStatus: PreviewStatus;
  errorMessage: string | null;
  htmlContent: string | null;
  liveReload: boolean;
  reloadKey: number;

  setRightPanelWidth: (width: number) => void;
  setActiveUrl: (url: string) => void;
  setActiveTab: (tab: string) => void;
  setIsLive: (isLive: boolean) => void;

  openUrl: (url: string) => void;
  openProject: (project: { name?: string; url?: string; htmlContent?: string; type?: ProjectType }) => void;
  reloadPreview: () => void;
  detectProject: (urlOrFile: string) => { mode: PreviewMode; projectType: ProjectType };
  setMode: (mode: PreviewMode) => void;
  setPreviewStatus: (status: PreviewStatus, message?: string | null) => void;
  setHtmlContent: (html: string | null) => void;
  toggleLiveReload: () => void;
}

const STORAGE_KEY = 'jarvis_browser_ai_width';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

const getInitialWidth = (): number => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    }
  } catch (_) {}
  return DEFAULT_WIDTH;
};

export const detectProjectFromUrl = (urlOrFile: string): { mode: PreviewMode; projectType: ProjectType } => {
  const normalized = urlOrFile.toLowerCase().trim();

  if (normalized.includes('5173') || normalized.includes('vite')) {
    return { mode: 'react', projectType: 'vite' };
  }
  if (normalized.includes('3000') || normalized.includes('next')) {
    return { mode: 'react', projectType: 'next' };
  }
  if (normalized.includes('8080') || normalized.includes('8000')) {
    return { mode: 'website', projectType: 'static' };
  }
  if (normalized.endsWith('.html') || normalized.includes('index.html') || normalized.startsWith('data:text/html')) {
    return { mode: 'html', projectType: 'html' };
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return { mode: 'website', projectType: 'static' };
  }

  return { mode: 'website', projectType: 'static' };
};

export const useBrowserStore = create<BrowserState>((set, get) => ({
  rightPanelWidth: getInitialWidth(),
  activeUrl: 'http://localhost:5173/',
  activeTab: 'AI Landing Page',
  activeTabId: 'tab-1',
  tabs: [
    {
      id: 'tab-1',
      name: 'AI Landing Page',
      url: 'http://localhost:5173/',
      mode: 'react',
      projectType: 'vite',
    },
  ],
  isLive: true,

  currentMode: 'react',
  projectType: 'vite',
  loading: false,
  previewStatus: 'ready',
  errorMessage: null,
  htmlContent: null,
  liveReload: true,
  reloadKey: 1,

  setRightPanelWidth: (width: number) => {
    const bounded = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, bounded.toString());
      }
    } catch (_) {}
    set({ rightPanelWidth: bounded });
  },

  setActiveUrl: (url: string) => {
    const detected = detectProjectFromUrl(url);
    set({
      activeUrl: url,
      currentMode: detected.mode,
      projectType: detected.projectType,
    });
  },

  setActiveTab: (tab: string) => set({ activeTab: tab }),
  setIsLive: (isLive: boolean) => set({ isLive }),

  openUrl: (url: string) => {
    const detected = detectProjectFromUrl(url);
    set({
      activeUrl: url,
      currentMode: detected.mode,
      projectType: detected.projectType,
      loading: true,
      previewStatus: 'loading',
      errorMessage: null,
      reloadKey: get().reloadKey + 1,
    });
  },

  openProject: (project) => {
    const targetUrl = project.url || 'http://localhost:5173/';
    const detected = project.type
      ? { mode: project.htmlContent ? 'html' : 'generated' as PreviewMode, projectType: project.type }
      : detectProjectFromUrl(targetUrl);

    set({
      activeTab: project.name || 'Project Preview',
      activeUrl: targetUrl,
      htmlContent: project.htmlContent || null,
      currentMode: project.htmlContent ? 'html' : detected.mode,
      projectType: detected.projectType,
      previewStatus: 'ready',
      loading: false,
      errorMessage: null,
      reloadKey: get().reloadKey + 1,
    });
  },

  reloadPreview: () => {
    set((state) => ({
      previewStatus: 'reloading',
      reloadKey: state.reloadKey + 1,
    }));
    setTimeout(() => {
      set({ previewStatus: 'ready' });
    }, 150);
  },

  detectProject: (urlOrFile) => detectProjectFromUrl(urlOrFile),
  setMode: (mode) => set({ currentMode: mode }),
  setPreviewStatus: (status, message = null) => set({ previewStatus: status, errorMessage: message, loading: status === 'loading' }),
  setHtmlContent: (html) => set({ htmlContent: html, currentMode: html ? 'html' : get().currentMode }),
  toggleLiveReload: () => set((state) => ({ liveReload: !state.liveReload })),
}));
