import { useState, useRef } from 'react'
import { 
  FileCode, Play, Save, Search, Sparkles, 
  Terminal, ShieldAlert, Cpu, CheckCircle, RefreshCw 
} from 'lucide-react'
import { fileManager } from '../../../entities/coding/fileManager'
import { codingAgentManager } from '../../../entities/coding/CodingAgentManager'
import { codeSearch } from '../../../entities/coding/codeSearch'

export default function CodingWorkspace() {
  // File state
  const [filesList, setFilesList] = useState(fileManager.getFilesList())
  const [activeFile, setActiveFile] = useState(filesList[0] || null)
  const [editorContent, setEditorContent] = useState(activeFile ? activeFile.content : '')

  // Search state
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [symbolSearchQuery, setSymbolSearchQuery] = useState('')
  const [searchTab, setSearchTab] = useState<'files' | 'symbols'>('files')

  // AI Assist state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiGeneratedCodePreview, setAiGeneratedCodePreview] = useState('')

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('npm test')
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string; status: 'success' | 'failed' | 'running' }>>([
    { cmd: 'tsc --noEmit', output: 'TypeScript compilation completed successfully.', status: 'success' }
  ])
  const [terminalRunning, setTerminalRunning] = useState(false)
  const terminalBottomRef = useRef<HTMLDivElement>(null)

  // Sync files list
  const refreshFiles = () => {
    const list = fileManager.getFilesList()
    setFilesList(list)
    if (activeFile) {
      const updated = list.find(f => f.path === activeFile.path)
      if (updated) setActiveFile(updated)
    }
  }

  // Handle active file swap
  const handleSelectFile = (file: typeof activeFile) => {
    if (!file) return
    setActiveFile(file)
    setEditorContent(file.content)
    // Clear AI preview on swap
    setAiGeneratedCodePreview('')
    setAiResult('')
  }

  // Save editor changes
  const handleSaveFile = () => {
    if (!activeFile) return
    fileManager.saveFile(activeFile.path, editorContent)
    refreshFiles()
    addTerminalLog('system', `File saved: ${activeFile.name} (${editorContent.length} bytes)`, 'success')
  }

  // AI Code Explanation
  const handleExplainCode = async () => {
    if (!activeFile) return
    setAiLoading(true)
    setAiResult('')
    try {
      const explanation = await codingAgentManager.explainCode(editorContent)
      setAiResult(explanation)
    } catch (e: any) {
      setAiResult(`Explanation failed: ${e.message || String(e)}`)
    } finally {
      setAiLoading(false)
    }
  }

  // AI Bug Detection (Review)
  const handleReviewCode = async () => {
    if (!activeFile) return
    setAiLoading(true)
    setAiResult('')
    try {
      const action = await codingAgentManager.reviewCode(editorContent)
      const comments = action.resultDetails.reviewComments || []
      setAiResult(`Code Review Audit results:\n\n${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}`)
    } catch (e: any) {
      setAiResult(`Review failed: ${e.message || String(e)}`)
    } finally {
      setAiLoading(false)
    }
  }

  // AI Code Generation (writes to preview)
  const handleGenerateCode = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiResult('')
    setAiGeneratedCodePreview('')
    try {
      const action = await codingAgentManager.generateCode(aiPrompt, activeFile ? `Active File: ${activeFile.name}` : '')
      const code = action.resultDetails.generatedCode || ''
      setAiResult(action.resultDetails.description || 'Code generated successfully.')
      setAiGeneratedCodePreview(code)
    } catch (e: any) {
      setAiResult(`Generation failed: ${e.message || String(e)}`)
    } finally {
      setAiLoading(false)
    }
  }

  // Apply AI preview to active editor
  const handleApplyPreview = () => {
    if (!aiGeneratedCodePreview || !activeFile) return
    setEditorContent(aiGeneratedCodePreview)
    setAiGeneratedCodePreview('')
    addTerminalLog('system', `AI generated preview applied to active editor for: ${activeFile.name}. Save changes to persist.`, 'success')
  }

  // Terminal Runner
  const handleRunCommand = async () => {
    const cmd = terminalInput.trim()
    if (!cmd) return

    setTerminalRunning(true)
    setTerminalHistory(prev => [...prev, { cmd, output: '', status: 'running' }])
    
    try {
      const res = await codingAgentManager.runCommand(cmd)
      setTerminalHistory(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          cmd,
          output: res.stdout || res.stderr || 'Command executed.',
          status: res.status === 'success' ? 'success' : 'failed'
        }
        return updated
      })
    } catch (e: any) {
      setTerminalHistory(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          cmd,
          output: e.message || 'Execution error.',
          status: 'failed'
        }
        return updated
      })
    } finally {
      setTerminalRunning(false)
      setTimeout(() => {
        terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  const addTerminalLog = (cmd: string, output: string, status: 'success' | 'failed') => {
    setTerminalHistory(prev => [...prev, { cmd, output, status }])
    setTimeout(() => {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // Filter lists based on query
  const filteredFiles = filesList.filter(f => 
    f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(fileSearchQuery.toLowerCase())
  )

  const symbolSearchResults = symbolSearchQuery.trim()
    ? codeSearch.searchSymbols(symbolSearchQuery)
    : []

  return (
    <div className="w-full h-full min-h-0 flex-1 grid grid-cols-[20%_1fr_25%] gap-4 overflow-hidden font-mono text-white p-1 select-none">
      
      {/* LEFT PANEL: FILE EXPLORER */}
      <div className="border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between min-h-0">
        <div className="flex flex-col min-h-0 space-y-3">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <FileCode size={13} className="text-[#FF0055]" />
            <span className="text-[10px] font-black tracking-widest uppercase">PROJECT EXPLORER</span>
          </div>
          
          {/* File search inside Explorer */}
          <div className="relative flex-shrink-0">
            <input 
              type="text" 
              value={fileSearchQuery}
              onChange={(e) => setFileSearchQuery(e.target.value)}
              placeholder="Filter files..."
              className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] outline-none placeholder-white/20 focus:border-[#FF0055]/40"
            />
            <Search size={11} className="absolute right-2.5 top-2.5 text-white/35" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 hide-scrollbar">
            {filteredFiles.map((file) => {
              const isActive = activeFile && activeFile.path === file.path
              return (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`w-full text-left truncate px-2.5 py-2 rounded-lg text-[10px] transition-all ${
                    isActive 
                      ? 'bg-[#FF0055]/10 border border-[#FF0055]/30 text-white font-bold shadow-[0_0_12px_rgba(255,0,85,0.05)]' 
                      : 'hover:bg-white/5 border border-transparent text-white/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                      file.extension === 'ts' || file.extension === 'tsx' 
                        ? 'bg-[#00DFFF]/10 text-[#00DFFF] border border-[#00DFFF]/20'
                        : 'bg-white/10 text-white/55'
                    }`}>
                      {file.extension}
                    </span>
                    <span className="truncate">{file.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-[8px] text-white/30 border-t border-white/5 pt-2 flex justify-between tracking-widest font-bold">
          <span>SANDBOXED // ROOT</span>
          <span>{filesList.length} FILES</span>
        </div>
      </div>

      {/* CENTER PANEL: EDITOR & TERMINAL */}
      <div className="flex flex-col gap-4 min-w-0 min-h-0">
        
        {/* Editor container */}
        <div className="flex-1 border border-white/10 rounded-xl bg-black/40 p-4 flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-shrink-0">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white/90 truncate">{activeFile ? activeFile.path : 'No file open'}</span>
              <span className="text-[8px] text-white/30 tracking-widest mt-0.5 uppercase">
                {activeFile ? `Line Count: ${activeFile.lineCount} // Size: ${activeFile.sizeBytes} B` : 'WORKSPACE ACTIVE'}
              </span>
            </div>
            {activeFile && (
              <button
                onClick={handleSaveFile}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-[#FF0055] text-white text-[9px] font-bold hover:bg-[#FF3377] transition-all shadow-[0_0_12px_rgba(255,0,85,0.2)]"
              >
                <Save size={10} />
                <span>SAVE CHANGES</span>
              </button>
            )}
          </div>

          <div className="flex-1 my-3 flex min-h-0 text-left font-mono relative overflow-hidden bg-black/20 border border-white/5 rounded-lg">
            {activeFile ? (
              <>
                {/* Simulated line numbers */}
                <div className="w-9 select-none text-right pr-2 text-white/15 text-[10px] bg-black/20 py-2 border-r border-white/5 leading-normal">
                  {Array.from({ length: Math.max(1, editorContent.split('\n').length) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="flex-1 bg-transparent p-2 outline-none border-none resize-none text-[10px] text-white/80 leading-normal font-mono w-full min-h-0 h-full overflow-y-auto"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-xs">
                <FileCode size={30} className="mb-2 animate-pulse" />
                <span>Select a file from explorer to edit code.</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Whitelisted Terminal */}
        <div className="h-44 border border-white/10 rounded-xl bg-black/50 p-3.5 flex flex-col justify-between flex-shrink-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <Terminal size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">SANDBOX TERMINAL</span>
            </div>
            <span className="text-[8px] text-white/30 font-bold tracking-widest">COMMAND WHITELIST CONSOLE</span>
          </div>

          <div className="flex-1 my-2 overflow-y-auto hide-scrollbar text-left text-[9px] space-y-1.5 font-mono pr-1 min-h-0">
            {terminalHistory.map((log, idx) => (
              <div key={idx} className="space-y-0.5 border-l-2 border-white/10 pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 font-bold">jarvis@sandbox:~$ <span className="text-white/85">{log.cmd}</span></span>
                  <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    log.status === 'success' ? 'bg-[#00FFCC]/15 text-[#00FFCC]' : log.status === 'failed' ? 'bg-[#FF0055]/15 text-[#FF0055]' : 'bg-[#00DFFF]/15 text-[#00DFFF] animate-pulse'
                  }`}>
                    {log.status}
                  </span>
                </div>
                {log.output && (
                  <pre className="text-white/60 font-mono whitespace-pre-wrap leading-relaxed select-text mt-0.5">{log.output}</pre>
                )}
              </div>
            ))}
            <div ref={terminalBottomRef} />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="flex-1 flex items-center justify-between bg-black border border-white/10 rounded-lg px-2.5 py-1 text-[10px]">
              <span className="text-white/30 pr-1 flex-shrink-0">cmd_input &gt;</span>
              <input 
                type="text" 
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunCommand()
                }}
                disabled={terminalRunning}
                placeholder="npm test / tsc --noEmit / git status..."
                className="w-full bg-transparent outline-none border-none text-white/80 placeholder-white/15 text-[10px] font-mono"
              />
            </div>
            <button
              onClick={handleRunCommand}
              disabled={terminalRunning}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-[#FF0055]/10 hover:border-[#FF0055]/30 text-white/70 hover:text-white transition-all text-[9px] font-bold flex items-center space-x-1"
            >
              {terminalRunning ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
              <span>EXEC</span>
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: AI ASSIST & SYMBOL SEARCH */}
      <div className="border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col min-h-0">
        
        {/* Toggle tab */}
        <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/5 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setSearchTab('files')}
            className={`py-1.5 text-center text-[9px] font-black tracking-widest rounded transition-all ${
              searchTab === 'files' ? 'bg-[#FF0055] text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            AI ASSIST
          </button>
          <button
            onClick={() => setSearchTab('symbols')}
            className={`py-1.5 text-center text-[9px] font-black tracking-widest rounded transition-all ${
              searchTab === 'symbols' ? 'bg-[#FF0055] text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            SYMBOL INDEX
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between min-h-0 mt-3.5">
          {searchTab === 'files' ? (
            // Tab A: AI ASSIST
            <div className="flex-1 flex flex-col min-h-0 justify-between space-y-4">
              <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
                
                {/* AI prompt input */}
                <div className="flex flex-col space-y-1.5 flex-shrink-0 text-left">
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">AI Directives Instruction</span>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe code changes to generate..."
                    className="w-full h-16 bg-black border border-white/10 rounded-lg p-2 text-[10px] outline-none resize-none placeholder-white/20 focus:border-[#FF0055]/40 font-mono"
                  />
                </div>

                {/* AI action triggers */}
                <div className="grid grid-cols-3 gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleExplainCode}
                    disabled={aiLoading || !activeFile}
                    className="py-1.5 text-[8px] font-black tracking-wider bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-[#FF0055]/10 hover:border-[#FF0055]/30 transition-all flex items-center justify-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>EXPLAIN</span>
                  </button>
                  <button
                    onClick={handleReviewCode}
                    disabled={aiLoading || !activeFile}
                    className="py-1.5 text-[8px] font-black tracking-wider bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-[#FF0055]/10 hover:border-[#FF0055]/30 transition-all flex items-center justify-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ShieldAlert size={9} />
                    <span>AUDIT</span>
                  </button>
                  <button
                    onClick={handleGenerateCode}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="py-1.5 text-[8px] font-black tracking-wider bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-lg text-white font-bold hover:bg-[#FF0055]/20 hover:text-white transition-all flex items-center justify-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(255,0,85,0.02)]"
                  >
                    <Sparkles size={9} className="text-[#FF0055]" />
                    <span>GENERATE</span>
                  </button>
                </div>

                {/* AI Output preview */}
                <div className="flex-1 border border-white/5 rounded-lg bg-black/20 p-2.5 text-left text-[9px] font-mono overflow-y-auto leading-relaxed pr-1 min-h-0 select-text">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-2">
                      <RefreshCw size={14} className="animate-spin text-[#FF0055]" />
                      <span>Requesting Gemini compilation...</span>
                    </div>
                  ) : aiGeneratedCodePreview ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-[#00FFCC] font-bold text-[8px] tracking-wider uppercase">GENERATED CODE READY</span>
                        <button
                          onClick={handleApplyPreview}
                          className="px-2 py-0.5 rounded bg-[#00FFCC] text-black font-bold text-[8px] hover:bg-white transition-all"
                        >
                          APPLY CODE
                        </button>
                      </div>
                      <pre className="text-white/80 font-mono whitespace-pre-wrap">{aiGeneratedCodePreview}</pre>
                    </div>
                  ) : aiResult ? (
                    <pre className="text-white/60 font-mono whitespace-pre-wrap">{aiResult}</pre>
                  ) : (
                    <div className="text-white/20 text-center py-12">
                      Request explanations, reviews, or code additions to see output.
                    </div>
                  )}
                </div>

              </div>

              <div className="text-[7px] text-white/30 text-center border-t border-white/5 pt-2 tracking-widest font-black flex justify-center items-center space-x-1">
                <Cpu size={10} className="text-[#00DFFF] animate-pulse" />
                <span>INTELLIGENT AGENT CONNECTED</span>
              </div>
            </div>
          ) : (
            // Tab B: SYMBOL INDEX
            <div className="flex-1 flex flex-col min-h-0 justify-between space-y-4">
              <div className="flex flex-col space-y-3 min-h-0 flex-1">
                
                {/* Symbol Query input */}
                <div className="flex flex-col space-y-1.5 flex-shrink-0 text-left">
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Symbol Query</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={symbolSearchQuery}
                      onChange={(e) => setSymbolSearchQuery(e.target.value)}
                      placeholder="Search functions, classes, interfaces..."
                      className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] outline-none placeholder-white/20 focus:border-[#FF0055]/40"
                    />
                    <Search size={11} className="absolute right-2.5 top-2.5 text-white/35" />
                  </div>
                </div>

                {/* Symbols results */}
                <div className="flex-1 border border-white/5 rounded-lg bg-black/20 p-2.5 text-left text-[9px] overflow-y-auto pr-1 min-h-0 space-y-2">
                  {!symbolSearchQuery.trim() ? (
                    <div className="text-white/20 text-center py-12 leading-relaxed">
                      Type above to query workspace symbols (classes, methods, interfaces, types).
                    </div>
                  ) : symbolSearchResults.length === 0 ? (
                    <div className="text-white/35 text-center py-12">
                      No matching workspace symbols located.
                    </div>
                  ) : (
                    symbolSearchResults.map((sym, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const file = filesList.find(f => f.path === sym.file.path)
                          if (file) handleSelectFile(file)
                        }}
                        className="w-full text-left p-2 rounded border border-white/5 bg-black/40 hover:bg-[#FF0055]/5 hover:border-[#FF0055]/20 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-[8px] font-bold">
                          <span className="text-[#00DFFF] uppercase">{sym.type}</span>
                          <span className="text-white/30 truncate max-w-[120px]">{sym.file.name} : L{sym.line}</span>
                        </div>
                        <div className="text-white/80 font-semibold truncate font-mono text-[9px]">{sym.content}</div>
                      </button>
                    ))
                  )}
                </div>

              </div>

              <div className="text-[7px] text-white/30 text-center border-t border-white/5 pt-2 tracking-widest font-black flex justify-center items-center space-x-1">
                <CheckCircle size={10} className="text-[#00FFCC]" />
                <span>INDEX SYNCED IN MEMORY</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
