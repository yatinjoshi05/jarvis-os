import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, Plus, Terminal, Folder, Chrome, Code2, Sparkles, FileText, Binary, LineChart, Users } from 'lucide-react'
import { motion } from 'framer-motion'

import { assistantState, useAssistantState, speechRecognitionManager, aiResponseManager, voiceManager } from '../../../shared/ai/AIManager'

export default function ConsoleAndDock() {
  const navigate = useNavigate()
  const { listening, thinking, transcript } = useAssistantState()
  const [command, setCommand] = useState('')

  useEffect(() => {
    if (listening) {
      setCommand(transcript)
    }
  }, [listening, transcript])

  const sendCommand = async () => {
    const text = command.trim()
    if (!text) return

    assistantState.updateTranscript(text)
    setCommand('')
    speechRecognitionManager.clear()

    try {
      await aiResponseManager.respond()
    } catch (e) {
      console.error('AI response error:', e)
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

  return (
    <div className="w-full max-w-[700px] flex flex-col items-center space-y-3 flex-shrink-0 font-mono select-none text-white pb-1">
      {/* Input Bar row */}
      <div className="w-full flex items-center space-x-2.5">
        <div className={`flex-1 flex items-center justify-between bg-black border ${
          listening ? 'border-[#FF0055] shadow-[0_0_15px_rgba(255,0,85,0.25)]' : 'border-white/15'
        } rounded-full px-5 py-2.5 h-10 text-xs shadow-[0_0_15px_rgba(255,0,85,0.02)] transition-all duration-300`}>
          <input
            id="console-input"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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
                : 'Type a command or ask anything...'
            }
            className="bg-transparent outline-none border-none text-white/85 w-full placeholder-white/20 text-xs font-mono"
          />
          <button
            onClick={sendCommand}
            disabled={thinking}
            className={`text-[#FF0055] hover:text-white transition-colors pl-2 ${
              thinking ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            <Send size={12} />
          </button>
        </div>
        {/* Mic trigger */}
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

      {/* Floating App Dock */}
      <div className="flex items-center bg-black/60 border border-white/10 px-4 py-2 rounded-2xl space-x-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {[
          { icon: <Terminal size={14} />, path: '/terminal' },
          { icon: <Folder size={14} />, path: '/files' },
          { icon: <Chrome size={14} />, path: '/browser' },
          { icon: <Code2 size={14} />, path: '/coding' },
          { icon: <Sparkles size={14} />, path: '/chat' },
          { icon: <FileText size={14} />, path: '/memory' },
          { icon: <Binary size={14} />, path: '/devices' },
          { icon: <LineChart size={14} />, path: '/trading' },
          { icon: <Users size={14} />, path: '/crm' }
        ].map((app, idx) => (
          <motion.button
            key={idx}
            onClick={() => navigate(app.path)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 hover:border-[#5A5670]/40 hover:text-white transition-colors"
            whileHover={{ scale: 1.15, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {app.icon}
          </motion.button>
        ))}
        <div className="w-[1px] h-4 bg-white/10" />
        <button 
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-white/40 flex items-center justify-center hover:text-white transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
