import { create } from 'zustand';
import { ViewerMode, FileDetectorService } from '../services/FileDetector';

export interface ActiveFileItem {
  name: string;
  url?: string;
  content?: string;
  path?: string;
  size?: number;
  type?: ViewerMode;
}

interface FilePreviewState {
  currentFile: ActiveFileItem | null;
  fileExtension: string;
  viewerMode: ViewerMode | null;
  zoom: number;
  rotation: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  wordWrap: boolean;
  loading: boolean;
  error: string | null;

  openFile: (file: ActiveFileItem) => void;
  closeFile: () => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setSearchQuery: (query: string) => void;
  toggleWordWrap: () => void;
  setError: (err: string | null) => void;
  resetViewControls: () => void;
}

export const useFilePreviewStore = create<FilePreviewState>((set, get) => ({
  currentFile: null,
  fileExtension: '',
  viewerMode: null,
  zoom: 100,
  rotation: 0,
  page: 1,
  totalPages: 1,
  searchQuery: '',
  wordWrap: true,
  loading: false,
  error: null,

  openFile: (file) => {
    const meta = FileDetectorService.detect(file.name);
    set({
      currentFile: file,
      fileExtension: meta.extension,
      viewerMode: file.type || meta.viewerMode,
      zoom: 100,
      rotation: 0,
      page: 1,
      totalPages: 1,
      searchQuery: '',
      loading: false,
      error: null,
    });
  },

  closeFile: () => {
    set({
      currentFile: null,
      fileExtension: '',
      viewerMode: null,
      zoom: 100,
      rotation: 0,
      page: 1,
      totalPages: 1,
      searchQuery: '',
      error: null,
    });
  },

  setZoom: (zoom) => {
    const bounded = Math.max(50, Math.min(400, zoom));
    set({ zoom: bounded });
  },

  setRotation: (rotation) => {
    const normalized = (rotation % 360 + 360) % 360;
    set({ rotation: normalized });
  },

  setPage: (page) => {
    const bounded = Math.max(1, Math.min(get().totalPages, page));
    set({ page: bounded });
  },

  setTotalPages: (total) => set({ totalPages: Math.max(1, total) }),

  nextPage: () => {
    const { page, totalPages } = get();
    if (page < totalPages) {
      set({ page: page + 1 });
    }
  },

  previousPage: () => {
    const { page } = get();
    if (page > 1) {
      set({ page: page - 1 });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
  setError: (err) => set({ error: err, loading: false }),

  resetViewControls: () => set({ zoom: 100, rotation: 0, page: 1, searchQuery: '' }),
}));
