import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Plus, Chrome, FileText, Code, Monitor, Camera, Mic, Battery, Wifi, Shield } from 'lucide-react'
import { useAssistantState, aiResponseManager, voiceManager } from '../../../shared/ai/AIManager'
import JarvisHeartbeat from '../../../shared/ui/heartbeat/JarvisHeartbeat'

interface ActionRowProps {
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

function ActionRow({ label, icon, onClick }: ActionRowProps) {
  return (
    <div 
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/80 hover:bg-[#00DFFF]/5 hover:border-[#00DFFF]/20 hover:text-white transition-all cursor-pointer group"
    >
      <div className="flex items-center space-x-2.5">
        <span className="text-[#00DFFF]">{icon}</span>
        <span className="font-medium tracking-wide">{label}</span>
      </div>
      <Play size={8} className="text-white/20 group-hover:text-white/60" />
    </div>
  )
}

interface GaugeProps {
  percentage: number
  label: string
}

function Gauge({ percentage, label }: GaugeProps) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-11 h-11">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="22" cy="22" r={radius} className="stroke-white/5" strokeWidth="2.5" fill="transparent" />
          <circle
            cx="22"
            cy="22"
            r={radius}
            className="stroke-[#00DFFF]"
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{percentage}%</span>
      </div>
      <span className="text-[8px] text-white/40 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  )
}

/* ─── JARVIS Status Card ─── */
function JarvisStatusCard() {
  const { listening, thinking, speaking, transcript, caption, error } = useAssistantState()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-scroll caption/transcript container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript, caption])

  let statusLabel = 'ONLINE'
  let dotColor = 'bg-green-500'
  let dotAnimate = 'animate-pulse'
  let textColor = 'text-green-500'

  if (isOffline) {
    statusLabel = 'OFFLINE'
    dotColor = 'bg-gray-500'
    dotAnimate = ''
    textColor = 'text-gray-500'
  } else if (error) {
    statusLabel = 'ERROR'
    dotColor = 'bg-red-500'
    dotAnimate = ''
    textColor = 'text-red-500'
  } else if (speaking) {
    statusLabel = 'SPEAKING...'
    dotColor = 'bg-[#FF00FF]'
    dotAnimate = ''
    textColor = 'text-[#FF00FF]'
  } else if (thinking) {
    statusLabel = 'THINKING...'
    dotColor = 'bg-[#8800FF]'
    dotAnimate = 'animate-pulse'
    textColor = 'text-[#8800FF]'
  } else if (listening) {
    statusLabel = 'LISTENING...'
    dotColor = 'bg-[#00FFCC]'
    dotAnimate = 'animate-ping'
    textColor = 'text-[#00FFCC]'
  }

  return (
    <div className="flex-1 min-h-[140px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
        <span className="bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] bg-clip-text text-transparent font-black uppercase text-xs tracking-widest">JARVIS</span>
        <div className={`flex items-center space-x-1 text-[9px] ${textColor} font-bold tracking-widest`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${dotAnimate}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Body — Renders the canvas-based JarvisHeartbeat always, overlaying live labels or subtitles */}
      <div className="flex-1 flex flex-col justify-center py-1.5 my-auto min-h-[70px]">
        <JarvisHeartbeat />

        {/* Dynamic status/caption textual area */}
        {(listening || speaking || thinking || error || isOffline) && (
          <div ref={scrollRef} className="w-full max-h-[44px] overflow-y-auto hide-scrollbar mt-1 text-center px-1">
            {isOffline ? (
              <p className="text-[9px] text-gray-400 font-bold tracking-wider">NETWORK DISCONNECTED</p>
            ) : error ? (
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider animate-pulse">{error}</p>
            ) : speaking ? (
              <p className="text-[9px] text-white/80 leading-relaxed font-medium transition-all duration-300">
                {caption || '...'}
              </p>
            ) : thinking ? (
              <p className="text-[9px] text-[#8800FF]/80 italic tracking-widest animate-pulse">THINKING...</p>
            ) : listening ? (
              <p className="text-[9px] text-[#00FFCC]/80 font-semibold tracking-wide">
                {transcript || 'Listening...'}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-1.5 text-[9px] flex-shrink-0">
        <span className="text-white/40">Wake Word : JARVIS</span>
        <span className="px-1.5 py-0.5 border border-[#00FFCC]/40 bg-[#00FFCC]/10 text-[#00FFCC] rounded text-[8px] font-bold">ON</span>
      </div>
    </div>
  )
}

export default function WorkspaceLeftColumn() {
  const navigate = useNavigate()
  const { listening } = useAssistantState()

  const [cpu, setCpu] = useState(12)
  const [ram, setRam] = useState(32)

  useEffect(() => {
    const timer = setInterval(() => {
      setCpu(Math.floor(10 + Math.random() * 15))
      setRam(Math.floor(31 + Math.sin(Date.now() * 0.0001) * 2))
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleVoiceNoteClick = () => {
    if (listening) {
      voiceManager.stopListening()
      aiResponseManager.respond()
    } else {
      voiceManager.startListening()
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 select-none font-mono">
      {/* CARD 1: JARVIS VOICE STATUS (dynamic) */}
      <JarvisStatusCard />

      {/* CARD 2: QUICK ACTIONS */}
      <div className="flex-1 min-h-[195px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-white/80 flex-shrink-0">
          <span className="text-[10px] font-bold tracking-widest uppercase">QUICK ACTIONS</span>
          <Plus size={11} className="text-white/40 hover:text-white cursor-pointer" />
        </div>
        <div className="space-y-1 my-auto">
          <ActionRow label="Open Chrome" icon={<Chrome size={11} />} onClick={() => navigate('/browser')} />
          <ActionRow label="Create New File" icon={<FileText size={11} />} onClick={() => navigate('/coding')} />
          <ActionRow label="AI Code Assistant" icon={<Code size={11} />} onClick={() => navigate('/coding')} />
          <ActionRow label="System Scan" icon={<Monitor size={11} />} onClick={() => navigate('/devices')} />
          <ActionRow label="Take Screenshot" icon={<Camera size={11} />} onClick={() => alert("Screenshot captured! (Simulated)")} />
          <ActionRow label="Voice Note" icon={<Mic size={11} />} onClick={handleVoiceNoteClick} />
        </div>
      </div>

      {/* CARD 3: SYSTEM STATUS */}
      <div className="flex-1 min-h-[125px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-white/80 flex-shrink-0">
          <span className="text-[10px] font-bold tracking-widest uppercase">SYSTEM STATUS</span>
          <Shield size={11} className="text-white/40" />
        </div>

        {/* 3 Circular Progress Rings */}
        <div className="flex items-center justify-around py-1.5 my-auto">
          <Gauge percentage={cpu} label="CPU" />
          <Gauge percentage={ram} label="RAM" />
          <Gauge percentage={67} label="DISK" />
        </div>

        {/* Bottom stats */}
        <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[9px] text-white/50 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <Battery size={11} className="text-green-500" />
            <span>BATTERY:</span>
            <span className="text-white font-bold">88%</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wifi size={11} className="text-[#00FFCC]" />
            <span>NETWORK:</span>
            <span className="text-green-500 font-bold">Good</span>
          </div>
        </div>
      </div>
    </div>
  )
}
