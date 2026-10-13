import { create } from 'zustand';
import {
  AppProjectType,
  AppPreviewMode,
  AppDeviceType,
  ProjectInspectorData,
  ProjectInspectorService,
} from '../services/ProjectInspectorService';

interface AppPreviewState {
  projectType: AppProjectType;
  previewMode: AppPreviewMode;
  deviceType: AppDeviceType;
  orientation: 'portrait' | 'landscape';
  runningPort: number;
  projectPath: string;
  loading: boolean;
  error: string | null;
  inspectorData: ProjectInspectorData;

  openApp: (config: {
    projectType?: AppProjectType;
    previewMode?: AppPreviewMode;
    deviceType?: AppDeviceType;
    orientation?: 'portrait' | 'landscape';
    runningPort?: number;
    projectPath?: string;
    files?: string[];
  }) => void;

  switchDevice: (device: AppDeviceType) => void;
  switchOrientation: (orientation: 'portrait' | 'landscape') => void;
  setPreviewMode: (mode: AppPreviewMode) => void;
  reloadPreview: () => void;
  inspectProject: (fileOrList: string | string[]) => void;
}

const defaultInspectorData: ProjectInspectorData = {
  framework: 'React 18 + Vite',
  port: 5173,
  status: 'Running',
  entryFile: 'src/App.tsx',
  dependenciesCount: 16,
  buildTimeMs: 150,
  projectType: 'react',
  previewMode: 'web',
  defaultDevice: 'desktop',
};

export const useAppPreviewStore = create<AppPreviewState>((set) => ({
  projectType: 'react',
  previewMode: 'web',
  deviceType: 'desktop',
  orientation: 'portrait',
  runningPort: 5173,
  projectPath: 'd:/jarvis/projects/spotify-clone',
  loading: false,
  error: null,
  inspectorData: defaultInspectorData,

  openApp: (config) => {
    const inspected = config.files ? ProjectInspectorService.inspect(config.files) : defaultInspectorData;
    const pType = config.projectType || inspected.projectType;
    const pMode = config.previewMode || inspected.previewMode;
    const dType = config.deviceType || inspected.defaultDevice;

    set({
      projectType: pType,
      previewMode: pMode,
      deviceType: dType,
      orientation: config.orientation || 'portrait',
      runningPort: config.runningPort || inspected.port,
      projectPath: config.projectPath || 'd:/jarvis/projects/app',
      inspectorData: {
        ...inspected,
        projectType: pType,
        previewMode: pMode,
        port: config.runningPort || inspected.port,
      },
      loading: false,
      error: null,
    });
  },

  switchDevice: (device) => set({ deviceType: device }),
  switchOrientation: (orientation) => set({ orientation }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  reloadPreview: () => {
    set({ loading: true });
    setTimeout(() => set({ loading: false }), 200);
  },

  inspectProject: (fileOrList) => {
    const data = ProjectInspectorService.inspect(fileOrList);
    set({
      inspectorData: data,
      projectType: data.projectType,
      previewMode: data.previewMode,
      deviceType: data.defaultDevice,
      runningPort: data.port,
    });
  },
}));
