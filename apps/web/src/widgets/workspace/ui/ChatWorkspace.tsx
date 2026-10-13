import { useRef, useEffect, useState } from 'react'
import { Send, Mic, Sparkles, AlertCircle, RefreshCw, Copy, Edit2, Trash2, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { 
  assistantState, 
  useAssistantState, 
  speechRecognitionManager, 
  aiResponseManager,
  voiceManager
} from '../../../shared/ai/AIManager'
import { conversationManager, useConversationHistory } from '../../../shared/ai/ConversationManager'
import { textToSpeechManager } from '../../../shared/ai/TextToSpeechManager'
import { aiRouter } from '../../../shared/ai/AIRouter'
import MarkdownRenderer from '../../../shared/ui/MarkdownRenderer'

export default function ChatWorkspace() {
  const history = useConversationHistory()
  const { listening, thinking, error, streamingResponse } = useAssistantState()
  
  const [command, setCommand] = useState('')
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [isEditing, setIsEditing] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCopy = async (content: string) => {
    const { copyToClipboard } = await import('../../../shared/utils/clipboard')
    await copyToClipboard(content)
  }

  const handleStartEdit = (index: number, content: string) => {
    setIsEditing(index)
    setEditContent(content)
  }

  const handleSaveEdit = (index: number) => {
    if (!editContent.trim()) return
    setIsEditing(null)
    conversationManager.updateMessageAndRegenerate(index, editContent, aiResponseManager)
  }

  const handleDelete = (index: number) => {
    conversationManager.deleteMessage(index)
  }

  const handleRegenerate = (index: number) => {
    conversationManager.regenerate(index, aiResponseManager)
  }

  // Sync vocal transcript with typing value during active listening
  useEffect(() => {
    if (listening) {
      setCommand(assistantState.transcript)
    }
  }, [listening, assistantState.transcript])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Re-focus input after thinking finishes
  useEffect(() => {
    if (!thinking) {
      inputRef.current?.focus()
    }
  }, [thinking])

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (feedRef.current && !isScrolledUp) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [history, streamingResponse, thinking])

  // Scroll event handler to detect manual user scrolling up
  const handleScroll = () => {
    if (feedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current
      // If we are more than 100px from the bottom, mark as scrolled up
      const isUp = scrollHeight - scrollTop - clientHeight > 100
      setIsScrolledUp(isUp)
    }
  }

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input from anywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Esc to cancel request/TTS
      if (e.key === 'Escape') {
        textToSpeechManager.stop()
        assistantState.reset()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sendCommand = async (customText?: string) => {
    const text = (customText !== undefined ? customText : command).trim()
    if (!text) return

    assistantState.updateTranscript(text)
    setCommand('')
    speechRecognitionManager.clear()
    setIsScrolledUp(false) // Reset scroll lock on sending new prompt

    try {
      await aiResponseManager.respond()
    } catch (e) {
      console.error('[ChatWorkspace] Send error:', e)
    }
  }

  const handleMicClick = () => {
    if (listening) {
      voiceManager.stopListening()
      aiResponseManager.respond()
    } else {
      voiceManager.startListening()
    }
  }

  const handleRetry = (msgContent: string) => {
    // Retry sends the last user message again
    sendCommand(msgContent)
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-full min-h-0 flex-1 flex flex-col justify-between select-none font-mono text-white p-2">
      {/* 1. Header Info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-shrink-0 px-1">
        <div className="flex items-center space-x-2">
          <Sparkles size={14} className="text-[#FF0055]" />
          <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] bg-clip-text text-transparent">
            JARVIS CONSOLE
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[9px] text-white/40 font-bold tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] animate-pulse" />
          <span>ACTIVE // {aiRouter.getLastUsedModel().toUpperCase()}</span>
        </div>
      </div>

      {/* 2. Message Feed */}
      <div 
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto hide-scrollbar space-y-4 py-4 px-1 flex flex-col min-h-0"
      >
        <AnimatePresence initial={false}>
          {history.map((msg, originalIdx) => {
            if (msg.role === 'system') return null;
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={originalIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 group w-full`}
              >
                <div className="flex items-center space-x-2 text-[8px] text-white/35 font-bold uppercase tracking-wider select-none">
                  <span>{isUser ? 'USER' : 'JARVIS'}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div className={
                  isUser 
                    ? 'max-w-[75%] bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-2xl rounded-tr-none px-4 py-3 text-xs text-white/90 leading-relaxed font-mono shadow-[0_0_15px_rgba(255,0,85,0.03)] relative'
                    : 'max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-white/90 leading-relaxed font-mono shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative'
                }>
                  {isEditing === originalIdx ? (
                    <div className="flex flex-col space-y-2 min-w-[240px]">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-xs focus:border-[#FF0055] outline-none font-mono resize-none w-full select-text"
                        rows={3}
                      />
                      <div className="flex space-x-2 justify-end select-none">
                        <button
                          onClick={() => setIsEditing(null)}
                          className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] hover:bg-white/10 transition-all font-bold"
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={() => handleSaveEdit(originalIdx)}
                          className="px-2 py-0.5 rounded border border-[#FF0055]/30 bg-[#FF0055]/10 text-[9px] text-[#FF0055] hover:bg-[#FF0055]/20 transition-all font-bold"
                        >
                          SAVE & REGENERATE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                {/* Actions Row */}
                {isEditing !== originalIdx && (
                  <div className="flex items-center space-x-2 text-[9px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 py-0.5 select-none">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="hover:text-white transition-colors p-1"
                      title="Copy Message"
                    >
                      <Copy size={10} />
                    </button>
                    {isUser && (
                      <button
                        onClick={() => handleStartEdit(originalIdx, msg.content)}
                        className="hover:text-white transition-colors p-1"
                        title="Edit Message"
                      >
                        <Edit2 size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(originalIdx)}
                      className="hover:text-red-400 transition-colors p-1"
                      title="Delete Message"
                    >
                      <Trash2 size={10} />
                    </button>
                    {!isUser && (
                      <button
                        onClick={() => handleRegenerate(originalIdx)}
                        className="hover:text-white transition-colors p-1"
                        title="Regenerate Response"
                      >
                        <RotateCcw size={10} />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Streaming/Thinking Bubble */}
        {(thinking || streamingResponse) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start space-y-1.5"
          >
            <div className="flex items-center space-x-2 text-[8px] text-[#00DFFF] font-bold uppercase tracking-wider animate-pulse">
              <span>JARVIS</span>
              <span>•</span>
              <span>STREAMING...</span>
            </div>
            
            <div className="max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-white/90 leading-relaxed font-mono shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex items-center">
              {thinking && !streamingResponse ? (
                <div className="flex items-center space-x-1 py-1">
                  <span className="w-1.5 h-1.5 bg-[#00DFFF] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 bg-[#00DFFF] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-[#00DFFF] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <div className="relative">
                  {streamingResponse}
                  <span className="inline-block w-1.5 h-3 bg-[#00DFFF] ml-1 animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Affordance & Retry */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl max-w-md mx-auto my-4 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
          >
            <div className="flex items-center space-x-2 text-red-400 text-xs font-bold tracking-wider uppercase">
              <AlertCircle size={14} />
              <span>CONNECTION DIRECTIVE FAILED</span>
            </div>
            <p className="text-[10px] text-red-300/80 text-center leading-relaxed px-2">
              {error}
            </p>
            {history.length > 0 && history.at(-1)?.role === 'user' && (
              <button
                onClick={() => handleRetry(history.at(-1)!.content)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-950/40 text-[9px] font-bold text-red-300 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
              >
                <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>RETRY DIRECTIVE</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* 3. Input Console */}
      <div className="flex-shrink-0 pt-2 flex flex-col items-center space-y-2.5">
        <div className="w-full flex items-center space-x-2.5">
          <div className={`flex-1 flex items-center justify-between bg-black border ${
            listening ? 'border-[#FF0055] shadow-[0_0_15px_rgba(255,0,85,0.25)]' : 'border-white/15'
          } rounded-full px-5 py-2.5 h-10 text-xs shadow-[0_0_15px_rgba(255,0,85,0.02)] transition-all duration-300`}>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendCommand()
                }
              }}
              disabled={thinking}
              placeholder={
                thinking
                  ? 'THINKING...'
                  : listening
                  ? 'LISTENING...'
                  : 'Type a message or ask anything...'
              }
              className="bg-transparent outline-none border-none text-white/85 w-full placeholder-white/20 text-xs font-mono"
            />
            <button
              onClick={() => sendCommand()}
              disabled={thinking}
              className={`text-[#FF0055] hover:text-white transition-colors pl-2 ${
                thinking ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <Send size={12} />
            </button>
          </div>
          
          <button
            onClick={handleMicClick}
            disabled={thinking}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
              listening
                ? 'bg-gradient-to-br from-[#FF0055] to-[#FF5500] text-white border-none animate-pulse shadow-[0_0_15px_rgba(255,0,85,0.4)]'
                : 'bg-[#FF0055]/10 border-[#FF0055]/40 text-[#FF0055] hover:bg-[#FF0055]/20 shadow-[0_0_12px_rgba(255,0,85,0.1)]'
            } ${thinking ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Mic size={15} />
          </button>
        </div>

        {/* Keyboard Shortcut Guides */}
        <div className="flex items-center space-x-4 text-[8px] text-white/25 font-bold tracking-wider pt-0.5 select-none">
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.2 rounded border border-white/10 bg-white/5 text-white/45">ENTER</span>
            <span>SEND</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.2 rounded border border-white/10 bg-white/5 text-white/45">SHIFT+ENTER</span>
            <span>NEWLINE</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.2 rounded border border-white/10 bg-white/5 text-white/45">ESC</span>
            <span>STOP</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.2 rounded border border-white/10 bg-white/5 text-white/45">CTRL+K</span>
            <span>FOCUS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
