import { useState, useEffect } from 'react'
import { Sparkles, Mic, Search, X, Play } from 'lucide-react'
import { voiceEngine } from '../../shared/voice/voiceEngine'
import { missionOrchestrator } from '../../entities/mission/orchestrator/MissionOrchestrator'
import { useMissionStore } from '../../entities/mission/model/useMissionStore'

export function FloatingOrb() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [promptInput, setPromptInput] = useState('')

  useEffect(() => {
    // Keyboard shortcut Ctrl+Space toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleVoiceToggle = () => {
    if (isListening) {
      voiceEngine.stop()
      setIsListening(false)
    } else {
      voiceEngine.initializeVoiceSystem()
      setIsListening(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptInput.trim()) return

    const store = useMissionStore.getState()
    const activeMission = store.activeMission
    const missionId = activeMission?.id || `m-${Date.now()}`

    setIsOpen(false)
    const currentPrompt = promptInput
    setPromptInput('')

    await missionOrchestrator.executeMission(missionId, currentPrompt)
  }

  return (
    <>
      {/* FLOATING ORB BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="JARVIS OS Floating Assistant (Ctrl+Space)"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full p-[2px] shadow-[0_0_24px_rgba(34,211,238,0.5)] transition-transform hover:scale-110 active:scale-95"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-cyan-400 p-[2px] animate-pulse">
            <div className="h-full w-full rounded-full bg-[#080d16]" />
          </div>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 shadow-[inset_0_0_12px_rgba(34,211,238,0.5)]">
            <Sparkles size={20} className="animate-spin-slow text-cyan-300" />
          </div>
        </button>
      </div>

      {/* QUICK COMMAND PALETTE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-[#080d16]/95 p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-cyan-300">
                <Sparkles size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">JARVIS OS Command Palette</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-cyan-400/60" />
                <input
                  type="text"
                  autoFocus
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ask JARVIS or describe a software mission..."
                  className="w-full rounded-xl border border-cyan-500/30 bg-black/40 py-3 pl-10 pr-12 text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-lg bg-cyan-500/20 p-2 text-cyan-300 hover:bg-cyan-500/40"
                >
                  <Play size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    isListening
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300 animate-pulse'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <Mic size={14} />
                  <span>{isListening ? 'Listening...' : 'Voice Assistant'}</span>
                </button>
                <span className="text-[10px] text-white/40">Press Ctrl+Space to toggle palette</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
