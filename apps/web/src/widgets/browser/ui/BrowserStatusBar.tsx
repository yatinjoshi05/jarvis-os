import React from 'react';
import { Lock } from 'lucide-react';
import { useBrowserStore } from '../model/useBrowserStore';
import { useFilePreviewStore } from '../model/useFilePreviewStore';

export const BrowserStatusBar: React.FC = () => {
  const { currentMode, previewStatus, projectType } = useBrowserStore();
  const { currentFile, viewerMode } = useFilePreviewStore();

  const getStatusDot = () => {
    if (currentFile) return 'bg-purple-400 animate-pulse';
    switch (previewStatus) {
      case 'ready':
      case 'reloading':
        return 'bg-emerald-400 animate-pulse';
      case 'loading':
      case 'compiling':
        return 'bg-amber-400 animate-pulse';
      case 'offline':
      case 'error':
        return 'bg-rose-400 animate-pulse';
      default:
        return 'bg-emerald-400';
    }
  };

  const getModeLabel = () => {
    if (currentFile && viewerMode) {
      return `File: ${viewerMode.toUpperCase()} (${currentFile.name})`;
    }
    switch (currentMode) {
      case 'react':
        return `React (${projectType.toUpperCase()})`;
      case 'html':
        return 'HTML / CSS / JS';
      case 'generated':
        return 'Generated Project';
      case 'website':
      default:
        return 'Website Preview';
    }
  };

  const getStatusLabel = () => {
    if (currentFile) return 'Previewing File';
    switch (previewStatus) {
      case 'loading':
        return 'Loading...';
      case 'compiling':
        return 'Compiling...';
      case 'reloading':
        return 'Live Reloading';
      case 'offline':
        return 'Waiting for Localhost';
      case 'error':
        return 'Server Offline';
      case 'ready':
      default:
        return 'Ready';
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-[#090A10] border-t border-white/10 text-[10px] font-mono text-white/50 select-none shrink-0">
      {/* Left items */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span>Browser Engine: Live</span>
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`} />
        </div>
        <span className="text-white/20">•</span>
        <div className="flex items-center space-x-1 max-w-xs truncate">
          <span className="text-white/40">Mode:</span>
          <span className="text-[#00DFFF] font-semibold truncate">{getModeLabel()}</span>
        </div>
        <span className="text-white/20">•</span>
        <div className="flex items-center space-x-1">
          <span className="text-white/40">Status:</span>
          <span className={currentFile ? 'text-purple-300' : previewStatus === 'offline' || previewStatus === 'error' ? 'text-rose-400' : 'text-emerald-400'}>
            {getStatusLabel()}
          </span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center space-x-2 text-white/40">
        <Lock className="w-3 h-3 text-emerald-400" />
        <span>Secure</span>
        <span>•</span>
        <span>Sandbox Enabled</span>
      </div>
    </div>
  );
};
