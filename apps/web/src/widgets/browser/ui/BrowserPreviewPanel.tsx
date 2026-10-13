import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  Monitor,
  Smartphone,
  X,
  Plus,
  LayoutDashboard,
  BarChart2,
  Folder,
  Layers,
  Settings,
  ChevronDown,
  RefreshCw,
  ServerOff,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw as RotateIcon,
  Search,
  Tablet as TabletIcon,
} from 'lucide-react';
import { useBrowserStore } from '../model/useBrowserStore';
import { useFilePreviewStore } from '../model/useFilePreviewStore';
import { useAppPreviewStore } from '../model/useAppPreviewStore';
import { browserEngine } from '../services/BrowserEngine';
import { PDFViewer } from './viewers/PDFViewer';
import { ImageViewer } from './viewers/ImageViewer';
import { CodeTextViewer } from './viewers/CodeTextViewer';
import { OfficeViewer } from './viewers/OfficeViewer';
import { MobileDeviceFrame } from './app-viewers/MobileDeviceFrame';
import { DesktopWindowFrame } from './app-viewers/DesktopWindowFrame';
import { PrototypeViewer } from './app-viewers/PrototypeViewer';

export const BrowserPreviewPanel: React.FC = () => {
  const {
    activeUrl,
    isLive,
    previewStatus,
    errorMessage,
    htmlContent,
    reloadKey,
    reloadPreview,
    setPreviewStatus,
  } = useBrowserStore();

  const {
    currentFile,
    viewerMode,
    zoom,
    setZoom,
    rotation,
    setRotation,
    page,
    totalPages,
    nextPage,
    previousPage,
    searchQuery,
    setSearchQuery,
    wordWrap,
    toggleWordWrap,
    closeFile,
  } = useFilePreviewStore();

  const {
    previewMode,
    deviceType,
    orientation,
    switchDevice,
    switchOrientation,
    setPreviewMode,
    inspectorData,
  } = useAppPreviewStore();

  const [urlInput, setUrlInput] = useState(activeUrl);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setUrlInput(activeUrl);
    setIframeError(false);
  }, [activeUrl]);

  useEffect(() => {
    browserEngine.initialize();
    return () => browserEngine.destroy();
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      closeFile();
      browserEngine.openUrl(urlInput.trim());
    }
  };

  const handleIframeError = () => {
    setIframeError(true);
    setPreviewStatus('offline', `Failed to connect to ${activeUrl}`);
  };

  const isLocalhost = activeUrl.includes('localhost') || activeUrl.includes('127.0.0.1');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#07080E] text-white font-sans select-none overflow-hidden rounded-lg border border-white/10 shadow-2xl">
      {/* 1. Browser Tab Bar (Scaled Down) */}
      <div className="flex items-center space-x-1 px-2 py-1 bg-[#0A0B12] border-b border-white/10">
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#141624] text-white text-[10px] font-medium rounded-t border-t-2 border-[#EC4899] shadow-sm">
          <span>{currentFile ? currentFile.name : 'AI Landing Page'}</span>
          <button
            onClick={() => closeFile()}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-2.5 h-2.5 text-[#EC4899]" />
          </button>
        </div>

        <button className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium text-white/50 hover:text-white/90 hover:bg-white/5 rounded-t transition-colors">
          <Plus className="w-2.5 h-2.5" />
          <span>New Tab</span>
        </button>
      </div>

      {/* 2. Navigation / Address Bar (Scaled Down) */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#0D0E17] border-b border-white/10 text-white/60">
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1">
          <button className="p-0.5 hover:text-white hover:bg-white/5 rounded transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button className="p-0.5 hover:text-white hover:bg-white/5 rounded transition-colors">
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => reloadPreview()}
            title="Reload Preview"
            className="p-0.5 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <RotateCw className={`w-3 h-3 ${previewStatus === 'reloading' ? 'animate-spin text-[#00DFFF]' : ''}`} />
          </button>
        </div>

        {/* URL Input Container */}
        <form onSubmit={handleUrlSubmit} className="flex-1 max-w-lg mx-3 relative flex items-center">
          <Lock className="w-2.5 h-2.5 absolute left-2.5 text-white/40" />
          <input
            type="text"
            value={currentFile ? `file:///${currentFile.name}` : urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-[#131522] border border-white/10 rounded-md pl-7 pr-3 py-0.5 text-[10px] font-mono text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#00DFFF]/50 transition-colors"
          />
        </form>

        {/* View Controls & Mode Switchers */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-0.5 bg-white/5 p-0.5 rounded border border-white/5">
            <button
              onClick={() => setPreviewMode('web')}
              className={`p-0.5 rounded transition-colors ${previewMode === 'web' ? 'bg-[#1A1D2E] text-[#00DFFF]' : 'hover:text-white'}`}
              title="Web Mode"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-0.5 rounded transition-colors ${previewMode === 'mobile' ? 'bg-[#1A1D2E] text-[#00DFFF]' : 'hover:text-white'}`}
              title="Mobile App Mode"
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-0.5 rounded transition-colors ${previewMode === 'desktop' ? 'bg-[#1A1D2E] text-purple-400' : 'hover:text-white'}`}
              title="Desktop App Mode (Tauri/Electron)"
            >
              <TabletIcon className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => reloadPreview()}
            className="p-0.5 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          {isLive && (
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 Contextual Top Toolbar for File & App Viewers */}
      {previewMode === 'mobile' ? (
        /* Mobile Preview Toolbar */
        <div className="flex items-center justify-between px-3 py-1 bg-[#101222] border-b border-white/10 text-[10px] font-mono text-white/80">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold uppercase">MOBILE APP PREVIEW</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60">{inspectorData.framework}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => switchDevice('iphone')}
              className={`px-2 py-0.5 rounded border transition-colors ${deviceType === 'iphone' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              iPhone
            </button>

            <button
              onClick={() => switchDevice('android')}
              className={`px-2 py-0.5 rounded border transition-colors ${deviceType === 'android' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              Android
            </button>

            <button
              onClick={() => switchDevice('tablet')}
              className={`px-2 py-0.5 rounded border transition-colors ${deviceType === 'tablet' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              Tablet
            </button>

            <span className="text-white/30">|</span>

            <button
              onClick={() => switchOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/90"
            >
              {orientation === 'portrait' ? 'Portrait 📱' : 'Landscape 📲'}
            </button>
          </div>
        </div>
      ) : previewMode === 'desktop' ? (
        /* Desktop Preview Toolbar */
        <div className="flex items-center justify-between px-3 py-1 bg-[#101222] border-b border-white/10 text-[10px] font-mono text-white/80">
          <div className="flex items-center space-x-2">
            <span className="text-purple-400 font-bold uppercase">DESKTOP APP PREVIEW</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60">{inspectorData.framework}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              Window Mode
            </span>

            <button onClick={() => reloadPreview()} className="p-1 hover:bg-white/10 rounded">
              <RotateCw className="w-3 h-3 text-purple-400" />
            </button>
          </div>
        </div>
      ) : currentFile && viewerMode ? (
        /* File Viewer Toolbar */
        <div className="flex items-center justify-between px-3 py-1 bg-[#101222] border-b border-white/10 text-[10px] font-mono text-white/80">
          <div className="flex items-center space-x-2">
            <span className="text-[#00DFFF] font-bold uppercase">{viewerMode} VIEWER</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60">{currentFile.name}</span>
          </div>

          <div className="flex items-center space-x-2">
            {viewerMode === 'pdf' && (
              <>
                <button onClick={previousPage} className="p-1 hover:bg-white/10 rounded">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span>Page {page} of {totalPages || 12}</span>
                <button onClick={nextPage} className="p-1 hover:bg-white/10 rounded">
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span className="text-white/30">|</span>
                <button onClick={() => setZoom(zoom - 10)} className="p-1 hover:bg-white/10 rounded">
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span>{zoom}%</span>
                <button onClick={() => setZoom(zoom + 10)} className="p-1 hover:bg-white/10 rounded">
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button onClick={() => setZoom(100)} className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded">
                  Fit Width
                </button>
              </>
            )}

            {viewerMode === 'image' && (
              <>
                <button onClick={() => setZoom(zoom - 15)} className="p-1 hover:bg-white/10 rounded">
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span>{zoom}%</span>
                <button onClick={() => setZoom(zoom + 15)} className="p-1 hover:bg-white/10 rounded">
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button onClick={() => setRotation(rotation + 90)} className="p-1 hover:bg-white/10 rounded" title="Rotate 90°">
                  <RotateIcon className="w-3 h-3 text-purple-400" />
                </button>
                <button onClick={() => { setZoom(100); setRotation(0); }} className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded">
                  Fit Screen
                </button>
              </>
            )}

            {(viewerMode === 'code' || viewerMode === 'text') && (
              <>
                <div className="relative flex items-center">
                  <Search className="w-3 h-3 absolute left-1.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#181A2D] border border-white/10 rounded pl-6 pr-2 py-0.5 text-[9px] font-mono text-white placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                <button onClick={toggleWordWrap} className={`px-2 py-0.5 rounded border ${wordWrap ? 'bg-[#00DFFF]/20 border-[#00DFFF]/40 text-[#00DFFF]' : 'bg-white/5 border-white/10 text-white/60'}`}>
                  Wrap
                </button>
              </>
            )}

            {viewerMode === 'office' && (
              <>
                <button onClick={previousPage} className="p-1 hover:bg-white/10 rounded">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span>Page {page} of {totalPages || 5}</span>
                <button onClick={nextPage} className="p-1 hover:bg-white/10 rounded">
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => setZoom(zoom === 100 ? 120 : 100)} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded">
                  Zoom {zoom}%
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* 3. Preview Canvas Container */}
      <div className="flex-1 relative bg-[#07080F] text-white overflow-hidden">
        {/* Scenario 1: App Preview Mode Active */}
        {previewMode === 'mobile' && <MobileDeviceFrame />}
        {previewMode === 'desktop' && <DesktopWindowFrame />}
        {previewMode === 'prototype' && <PrototypeViewer />}

        {/* Scenario 2: File Viewer Active */}
        {previewMode === 'web' && currentFile && viewerMode === 'pdf' && <PDFViewer />}
        {previewMode === 'web' && currentFile && viewerMode === 'image' && <ImageViewer />}
        {previewMode === 'web' && currentFile && (viewerMode === 'code' || viewerMode === 'text') && <CodeTextViewer />}
        {previewMode === 'web' && currentFile && viewerMode === 'office' && <OfficeViewer />}

        {/* Scenario 3: Offline / Server Not Running Error Screen */}
        {previewMode === 'web' && !currentFile && (previewStatus === 'offline' || previewStatus === 'error' || iframeError) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#07080F] z-20 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg">
              <ServerOff className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-xs font-bold text-white font-mono">
                {isLocalhost ? 'Preview server not running' : 'Unable to connect to server'}
              </h3>
              <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                {errorMessage || `Waiting for local dev server at ${activeUrl}. Start your app with "npm run dev" or "vite".`}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => {
                  setIframeError(false);
                  browserEngine.openUrl(activeUrl);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#00DFFF]/10 hover:bg-[#00DFFF]/20 border border-[#00DFFF]/30 text-[#00DFFF] text-[10px] font-mono font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Connection</span>
              </button>

              <button
                onClick={() => {
                  setIframeError(false);
                  setPreviewStatus('ready');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[10px] font-mono transition-colors"
              >
                <span>View Mock Preview</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Scenario 4: Dynamic HTML / srcdoc Renderer */}
        {previewMode === 'web' && !currentFile && htmlContent ? (
          <iframe
            key={`html-${reloadKey}`}
            srcDoc={htmlContent}
            title="JARVIS HTML Preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : previewMode === 'web' && !currentFile && activeUrl && (activeUrl.startsWith('http://') || activeUrl.startsWith('https://')) && !iframeError ? (
          /* Scenario 5: Live Web / Localhost Iframe Renderer */
          <iframe
            key={`url-${activeUrl}-${reloadKey}`}
            src={activeUrl}
            title="JARVIS Live Preview"
            onError={handleIframeError}
            className="w-full h-full border-none bg-black/20"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : previewMode === 'web' && !currentFile ? (
          /* Scenario 6: Phase 1 Nexora AI Landing Page Preview Fallback */
          <div className="w-full h-full overflow-y-auto p-4 relative select-text hide-scrollbar">
            {/* Ambient Radial Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-gradient-to-b from-purple-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

            {/* Nexora Navigation Header */}
            <header className="flex items-center justify-between py-2 px-4 max-w-4xl mx-auto border border-white/10 rounded-xl bg-[#0F111E]/80 backdrop-blur-md relative z-10 shadow-lg">
              {/* Logo */}
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-purple-500/20">
                  N
                </div>
                <span className="font-extrabold tracking-wider text-xs">NEXORA</span>
              </div>

              {/* Links */}
              <nav className="hidden md:flex items-center space-x-4 text-[10px] text-white/70 font-medium">
                <a href="#home" className="text-white font-semibold">Home</a>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="hover:text-white transition-colors">About</a>
                <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              </nav>

              {/* Action CTA */}
              <button className="px-3 py-1 text-[10px] font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all transform hover:scale-105">
                Get Started
              </button>
            </header>

            {/* Hero Section */}
            <section className="text-center mt-8 max-w-3xl mx-auto relative z-10 space-y-3">
              {/* Tag Pill */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-purple-300 backdrop-blur-md shadow-sm">
                <span>✨ The Future is Here</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                Build Smarter with <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Power
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-[11px] text-white/60 max-w-md mx-auto leading-relaxed">
                Nexora is the all-in-one platform to build, deploy and scale AI powered solutions with ease.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center justify-center space-x-3 pt-1">
                <button className="px-4 py-1.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
                  Get Started
                </button>
                <button className="px-4 py-1.5 text-[10px] font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 backdrop-blur-md transition-all">
                  Learn More
                </button>
              </div>
            </section>

            {/* Embedded Dashboard Preview Component Card */}
            <div className="mt-8 max-w-4xl mx-auto bg-[#0C0E1A]/90 border border-white/10 rounded-xl p-3.5 shadow-xl relative z-10 backdrop-blur-xl">
              <div className="flex gap-3">
                {/* Embedded Mini Sidebar */}
                <div className="w-36 bg-[#111324]/80 border border-white/5 rounded-lg p-2 flex flex-col justify-between shrink-0">
                  <div className="space-y-0.5">
                    <div className="px-2 py-1 rounded bg-[#1D2138] text-blue-400 text-[10px] font-medium flex items-center space-x-1.5">
                      <LayoutDashboard className="w-3 h-3" />
                      <span>Dashboard</span>
                    </div>
                    <div className="px-2 py-1 rounded text-white/50 text-[10px] font-medium flex items-center space-x-1.5 hover:text-white hover:bg-white/5 transition-colors">
                      <BarChart2 className="w-3 h-3" />
                      <span>Analytics</span>
                    </div>
                    <div className="px-2 py-1 rounded text-white/50 text-[10px] font-medium flex items-center space-x-1.5 hover:text-white hover:bg-white/5 transition-colors">
                      <Folder className="w-3 h-3" />
                      <span>Projects</span>
                    </div>
                    <div className="px-2 py-1 rounded text-white/50 text-[10px] font-medium flex items-center space-x-1.5 hover:text-white hover:bg-white/5 transition-colors">
                      <Layers className="w-3 h-3" />
                      <span>Integrations</span>
                    </div>
                    <div className="px-2 py-1 rounded text-white/50 text-[10px] font-medium flex items-center space-x-1.5 hover:text-white hover:bg-white/5 transition-colors">
                      <Settings className="w-3 h-3" />
                      <span>Settings</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Main Analytics View */}
                <div className="flex-1 space-y-3">
                  <h2 className="text-xs font-bold text-white/90">Overview</h2>

                  {/* 4 Metric Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-[#121527]/90 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-white/50 font-medium">Total Users</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-white">24.8K</span>
                        <span className="text-[8px] text-emerald-400 font-semibold">↑ 12.5%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#121527]/90 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-white/50 font-medium">AI Requests</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-white">98.4K</span>
                        <span className="text-[8px] text-emerald-400 font-semibold">↑ 18.2%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#121527]/90 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-white/50 font-medium">Success Rate</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-white">99.6%</span>
                        <span className="text-[8px] text-emerald-400 font-semibold">↑ 2.4%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#121527]/90 border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-white/50 font-medium">Revenue</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-[#00DFFF]">$48.9K</span>
                        <span className="text-[8px] text-emerald-400 font-semibold">↑ 15.3%</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Wave Chart & Donut Chart Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* SVG Smooth Performance Wave Curve */}
                    <div className="col-span-2 p-2 rounded-lg bg-[#121527]/90 border border-white/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-white/80">Performance</span>
                        <button className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/60 flex items-center space-x-0.5 border border-white/5">
                          <span>View Report</span>
                          <ChevronDown className="w-2 h-2" />
                        </button>
                      </div>

                      <div className="h-20 w-full">
                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0,80 Q 50,30 100,60 T 200,40 T 300,70 L 300,100 L 0,100 Z"
                            fill="url(#waveGradient)"
                          />
                          <path
                            d="M 0,80 Q 50,30 100,60 T 200,40 T 300,70"
                            fill="none"
                            stroke="#A78BFA"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* SVG Donut Chart */}
                    <div className="p-2 rounded-lg bg-[#121527]/90 border border-white/5 flex flex-col items-center justify-center relative">
                      <div className="w-14 h-14 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-white/10"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-purple-500"
                            strokeDasharray="78, 100"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-[10px] font-bold text-white block">78%</span>
                          <span className="text-[7px] text-white/50 block">Growth</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
