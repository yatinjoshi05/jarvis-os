export type AppProjectType = 'react' | 'next' | 'tauri' | 'electron' | 'flutter' | 'react-native' | 'prototype' | 'generated';
export type AppPreviewMode = 'web' | 'desktop' | 'mobile' | 'tablet' | 'prototype' | 'generated';
export type AppDeviceType = 'iphone' | 'android' | 'tablet' | 'desktop';

export interface ProjectInspectorData {
  framework: string;
  port: number;
  status: 'Running' | 'Compiling' | 'Building' | 'Stopped';
  entryFile: string;
  dependenciesCount: number;
  buildTimeMs: number;
  projectType: AppProjectType;
  previewMode: AppPreviewMode;
  defaultDevice: AppDeviceType;
}

export class ProjectInspectorService {
  /**
   * Inspect project directory, package manifest, or file names to detect framework & mode
   */
  public static inspect(fileListOrName: string | string[]): ProjectInspectorData {
    const list = Array.isArray(fileListOrName) ? fileListOrName : [fileListOrName];
    const joined = list.join(' ').toLowerCase();

    // 1. Tauri Desktop App
    if (joined.includes('tauri.conf.json') || joined.includes('main.rs') || joined.includes('src-tauri')) {
      return {
        framework: 'Tauri (Rust + React)',
        port: 1420,
        status: 'Running',
        entryFile: 'src-tauri/src/main.rs',
        dependenciesCount: 14,
        buildTimeMs: 420,
        projectType: 'tauri',
        previewMode: 'desktop',
        defaultDevice: 'desktop',
      };
    }

    // 2. Electron Desktop App
    if (joined.includes('electron.js') || joined.includes('main.js') || joined.includes('electron-builder')) {
      return {
        framework: 'Electron (Node + Chromium)',
        port: 3000,
        status: 'Running',
        entryFile: 'electron/main.js',
        dependenciesCount: 22,
        buildTimeMs: 510,
        projectType: 'electron',
        previewMode: 'desktop',
        defaultDevice: 'desktop',
      };
    }

    // 3. Flutter Mobile App
    if (joined.includes('pubspec.yaml') || joined.includes('flutter.yaml') || joined.includes('main.dart')) {
      return {
        framework: 'Flutter (Dart)',
        port: 8080,
        status: 'Running',
        entryFile: 'lib/main.dart',
        dependenciesCount: 18,
        buildTimeMs: 380,
        projectType: 'flutter',
        previewMode: 'mobile',
        defaultDevice: 'iphone',
      };
    }

    // 4. React Native / Expo Mobile App
    if (joined.includes('expo.json') || joined.includes('app.json') || joined.includes('app.js')) {
      return {
        framework: 'React Native (Expo)',
        port: 8081,
        status: 'Running',
        entryFile: 'App.js',
        dependenciesCount: 26,
        buildTimeMs: 290,
        projectType: 'react-native',
        previewMode: 'mobile',
        defaultDevice: 'iphone',
      };
    }

    // 5. Next.js Web App
    if (joined.includes('next.config.js') || joined.includes('next.config.ts') || joined.includes('pages/index.tsx')) {
      return {
        framework: 'Next.js (React Framework)',
        port: 3000,
        status: 'Running',
        entryFile: 'pages/index.tsx',
        dependenciesCount: 32,
        buildTimeMs: 240,
        projectType: 'next',
        previewMode: 'web',
        defaultDevice: 'desktop',
      };
    }

    // 6. UI Prototype / Design System / Figma
    if (joined.includes('figma') || joined.includes('wireframe') || joined.includes('prototype')) {
      return {
        framework: 'UI Design System Prototype',
        port: 5173,
        status: 'Running',
        entryFile: 'prototype.figma',
        dependenciesCount: 8,
        buildTimeMs: 120,
        projectType: 'prototype',
        previewMode: 'prototype',
        defaultDevice: 'desktop',
      };
    }

    // 7. Default Generated Project / React App (Vite)
    return {
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
  }
}
