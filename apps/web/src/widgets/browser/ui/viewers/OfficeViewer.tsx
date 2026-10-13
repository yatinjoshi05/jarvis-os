import React from 'react';
import { useFilePreviewStore } from '../../model/useFilePreviewStore';
import { FileSpreadsheet, FileText, Presentation, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export const OfficeViewer: React.FC = () => {
  const { currentFile, fileExtension, page, totalPages, nextPage, previousPage, zoom } = useFilePreviewStore();

  if (!currentFile) return null;

  const getOfficeIcon = () => {
    if (fileExtension.includes('xls')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (fileExtension.includes('ppt')) return <Presentation className="w-5 h-5 text-amber-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  const getDocTypeTitle = () => {
    if (fileExtension.includes('xls')) return 'Microsoft Excel Spreadsheet';
    if (fileExtension.includes('ppt')) return 'Microsoft PowerPoint Presentation';
    return 'Microsoft Word Document';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#07080E] p-6 relative select-none overflow-hidden font-sans">
      {/* Office Document Canvas Preview Box */}
      <div
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
        className="w-[540px] min-h-[420px] bg-[#0E101D] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 transition-transform duration-200 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              {getOfficeIcon()}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">{currentFile.name}</h2>
              <span className="text-[10px] font-mono text-white/50">{getDocTypeTitle()}</span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono text-blue-400">
            Page {page} of {totalPages || 5}
          </span>
        </div>

        {/* Content Body Preview Mock */}
        {fileExtension.includes('xls') ? (
          /* Spreadsheet View */
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white/80">Quarterly Performance Data</div>
            <div className="border border-white/10 rounded-lg overflow-hidden font-mono text-[10px]">
              <table className="w-full text-left">
                <thead className="bg-[#16192E] text-white/60">
                  <tr>
                    <th className="p-2 border-r border-white/10">Metric</th>
                    <th className="p-2 border-r border-white/10">Q1 2026</th>
                    <th className="p-2 border-r border-white/10">Q2 2026</th>
                    <th className="p-2">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  <tr>
                    <td className="p-2 border-r border-white/10 font-semibold">Active Users</td>
                    <td className="p-2 border-r border-white/10">18,400</td>
                    <td className="p-2 border-r border-white/10">24,800</td>
                    <td className="p-2 text-emerald-400">+34.7%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-white/10 font-semibold">Revenue</td>
                    <td className="p-2 border-r border-white/10">$32.1K</td>
                    <td className="p-2 border-r border-white/10">$48.9K</td>
                    <td className="p-2 text-emerald-400">+52.3%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-white/10 font-semibold">Latency (ms)</td>
                    <td className="p-2 border-r border-white/10">120ms</td>
                    <td className="p-2 border-r border-white/10">45ms</td>
                    <td className="p-2 text-emerald-400">-62.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : fileExtension.includes('ppt') ? (
          /* Presentation Slide View */
          <div className="h-44 bg-[#141728] border border-white/10 rounded-xl p-5 flex flex-col justify-between text-center relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-amber-400 tracking-widest uppercase">SLIDE {page}</span>
              <h3 className="text-base font-extrabold text-white">JARVIS Autonomous Preview System</h3>
            </div>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              Seamlessly renders Word, Excel, and PowerPoint documents with page navigation and download controls.
            </p>
            <div className="text-[9px] font-mono text-white/40">Jarvis OS Executive Briefing</div>
          </div>
        ) : (
          /* Word Document View */
          <div className="space-y-3 text-xs text-white/80 leading-relaxed font-sans">
            <p className="font-semibold text-white">Executive Report Summary:</p>
            <p>
              This document outlines the Phase 2B deployment of the Universal File Preview Engine in JARVIS OS. Users can open and interact with PDFs, high-resolution imagery, source code files, and office documents natively inside the Browser panel.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[10px] text-white/60 space-y-1">
              <div>• Native format auto-detection engine</div>
              <div>• Contextual dynamic top toolbar</div>
              <div>• Full backward compatibility with Phase 1 UI</div>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={previousPage}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-white/60">
              Page {page} of {totalPages || 5}
            </span>
            <button
              onClick={nextPage}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-semibold flex items-center space-x-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Download Original File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
