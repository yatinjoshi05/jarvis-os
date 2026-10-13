import React, { useState } from 'react';
import { useFilePreviewStore } from '../../model/useFilePreviewStore';
import { Copy, Check, FileCode } from 'lucide-react';

const MOCK_CODE_SNIPPETS: Record<string, string> = {
  json: `{\n  "name": "jarvis-browser-module",\n  "version": "2.4.0",\n  "description": "Universal File Preview Engine",\n  "mode": "production",\n  "features": [\n    "PDF Viewer",\n    "Image Viewer",\n    "Code & Text Viewer",\n    "Office Viewer"\n  ],\n  "status": "active"\n}`,
  tsx: `import React from 'react';\nimport { useBrowserStore } from '../model/useBrowserStore';\n\nexport const App: React.FC = () => {\n  const { currentMode, previewStatus } = useBrowserStore();\n  return (\n    <div className="jarvis-app flex font-mono text-white">\n      <h1>JARVIS Preview Engine ({currentMode})</h1>\n      <span className="status-badge">{previewStatus}</span>\n    </div>\n  );\n};`,
  py: `# JARVIS Autonomous System Control\nimport sys\nimport time\n\ndef run_diagnostics():\n    print("[JARVIS] Initiating core diagnostic sequence...")\n    time.sleep(0.5)\n    return {"status": "healthy", "uptime_ms": 145020}\n\nif __name__ == "__main__":\n    res = run_diagnostics()\n    print(f"[JARVIS] Diagnostics Complete: {res}")`,
};

export const CodeTextViewer: React.FC = () => {
  const { currentFile, fileExtension, searchQuery, wordWrap } = useFilePreviewStore();
  const [copied, setCopied] = useState(false);

  if (!currentFile) return null;

  const rawContent =
    currentFile.content ||
    MOCK_CODE_SNIPPETS[fileExtension] ||
    MOCK_CODE_SNIPPETS.tsx;

  const lines = rawContent.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07080F] text-white font-mono text-[11px] select-text overflow-hidden">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0C0E18] border-b border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-[#00DFFF]" />
          <span className="font-bold text-white/90">{currentFile.name}</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-mono text-white/60 uppercase">
            {fileExtension || 'code'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] text-white/50">
          <span>{lines.length} lines</span>
          <span>{rawContent.length} bytes</span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-pink-400" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Text Viewport with Line Numbers */}
      <div className={`flex-1 p-4 overflow-auto hide-scrollbar ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const matchesSearch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <tr key={idx} className={matchesSearch ? 'bg-amber-500/20' : 'hover:bg-white/5'}>
                  <td className="w-10 text-right pr-4 text-white/30 select-none font-mono text-[10px] align-top">
                    {lineNum}
                  </td>
                  <td className="text-white/90 leading-relaxed font-mono align-top">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
