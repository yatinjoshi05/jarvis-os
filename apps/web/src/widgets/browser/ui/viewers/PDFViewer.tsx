import React, { useEffect } from 'react';
import { useFilePreviewStore } from '../../model/useFilePreviewStore';
import { FileText } from 'lucide-react';

export const PDFViewer: React.FC = () => {
  const { currentFile, zoom, page, setTotalPages, setError } = useFilePreviewStore();

  useEffect(() => {
    // Set mock or real page total
    setTotalPages(12);
  }, [currentFile, setTotalPages]);

  if (!currentFile) return null;

  const pdfUrl = currentFile.url || currentFile.path || '';

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-[#080912] p-4 relative select-text overflow-hidden">
      {/* PDF Document Canvas / Embedded Frame Container */}
      <div className="flex-1 w-full max-w-3xl flex items-center justify-center min-h-0 relative overflow-auto hide-scrollbar">
        {pdfUrl && (pdfUrl.endsWith('.pdf') || pdfUrl.startsWith('blob:') || pdfUrl.startsWith('data:')) ? (
          <iframe
            src={`${pdfUrl}#page=${page}&zoom=${zoom}`}
            title={currentFile.name}
            className="w-full h-full border-none rounded-lg shadow-2xl bg-white/5"
            onError={() => setError('Cannot render target PDF document')}
          />
        ) : (
          /* Rendered Native High-Fidelity PDF Page Sheet Mock Canvas */
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-[520px] min-h-[700px] bg-[#111322] border border-white/10 rounded-xl p-8 shadow-2xl space-y-6 transition-transform duration-200 text-white/90 font-sans"
          >
            {/* PDF Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-sm tracking-wide">{currentFile.name}</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">Page {page} of 12</span>
            </div>

            {/* Document Title */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                JARVIS OS Architecture & System Specifications
              </h1>
              <p className="text-xs text-white/50 leading-relaxed font-mono">
                Document Revision 2.4 • Confidential Technical Report
              </p>
            </div>

            {/* Section Paragraphs */}
            <div className="space-y-4 text-xs text-white/70 leading-relaxed">
              <p>
                <strong>1. Executive Overview:</strong> The JARVIS OS Browser Module provides a unified, zero-latency preview engine designed for web applications, React components, and multi-format document rendering.
              </p>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 font-mono text-[11px]">
                <div className="text-[#00DFFF] font-semibold">● Core Architecture Modules:</div>
                <div className="text-white/60 pl-3">• WebsiteRenderer (Localhost & Web URLs)</div>
                <div className="text-white/60 pl-3">• HTMLRenderer (Direct DOM Injection)</div>
                <div className="text-white/60 pl-3">• FilePreviewEngine (PDF, Images, Code, Office)</div>
              </div>

              <p>
                <strong>2. Performance Specifications:</strong> Live reload updates execute in under 500ms while preserving browser state. Storage persistence guarantees panel layout configurations across app restarts.
              </p>
            </div>

            {/* PDF Page Footer */}
            <div className="pt-8 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/40">
              <span>JARVIS Technical Documentation</span>
              <span>Confidential • Page {page}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
