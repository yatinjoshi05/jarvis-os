import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Tablet, Laptop, Watch, Speaker, 
  Sliders, Calendar, FileText, Sparkles, 
  Clock, CheckSquare, BrainCircuit, Users
} from 'lucide-react'
import { useConversationHistory } from '../../../shared/ai/ConversationManager'
import { aiRouter } from '../../../shared/ai/AIRouter'
import { fileManager } from '../../../entities/coding/fileManager'
import { dashboardStore } from '../../../shared/dashboard/store'

interface MissionRowProps {
  title: string
  category: string
  percentage: number
}

const categoryColors: Record<string, string> = {
  work: 'text-[#00DFFF]',
  personal: 'text-[#8800FF]',
  trading: 'text-[#FF00FF]',
  health: 'text-[#FF5500]',
  system: 'text-[#00FFCC]',
  web: 'text-[#00DFFF]',
  code: 'text-[#FF00FF]',
}

const ALL_MISSIONS = [
  { title: "Complete Project Report", category: "Work", percentage: 75 },
  { title: "Study AI Algorithms", category: "Personal", percentage: 40 },
  { title: "Analyze Market Trends", category: "Trading", percentage: 60 },
  { title: "Workout for 30 mins", category: "Health", percentage: 20 },
  { title: "Verify System Security", category: "System", percentage: 90 },
  { title: "Optimize Web Performance", category: "Web", percentage: 45 },
  { title: "Refactor Coding Components", category: "Code", percentage: 80 }
]

function MissionRow({ title, category, percentage }: MissionRowProps) {
  const catColor = categoryColors[category.toLowerCase()] || 'text-white/60'

  return (
    <div className="space-y-1 py-0.5 select-none font-mono">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-white/80 font-bold tracking-wide truncate pr-2">{title}</span>
        <div className="flex items-center space-x-1.5 text-[9px] flex-shrink-0">
          <span className={`px-1 py-0.2 rounded bg-white/5 border border-white/5 ${catColor} font-semibold`}>{category}</span>
          <span className="text-white/70 font-semibold">{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className="h-full bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

interface MemoryRowProps {
  title: string
  time: string
}

function MemoryRow({ title, time }: MemoryRowProps) {
  return (
    <div className="flex justify-between items-center py-1 text-[10px] select-none font-mono border-b border-white/5 last:border-0 pb-1.5 last:pb-0">
      <span className="text-white/80 tracking-wide truncate pr-2">{title}</span>
      <span className="text-white/40 text-[9px] font-semibold flex-shrink-0">{time}</span>
    </div>
  )
}

interface DeviceRowProps {
  name: string
  icon: ReactNode
}

function DeviceRow({ name, icon }: DeviceRowProps) {
  return (
    <div className="flex justify-between items-center py-0.5 select-none font-mono">
      <div className="flex items-center space-x-2 text-[10px] text-white/80">
        <span className="text-white/40">{icon}</span>
        <span className="tracking-wide font-medium">{name}</span>
      </div>
      <div className="flex items-center space-x-1.5 text-[9px] font-bold text-[#00FFCC] tracking-wider">
        <span>Connected</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC]" />
      </div>
    </div>
  )
}

const CALENDAR_EVENTS = [
  { time: '09:00 AM', title: 'Daily Standup Sync', type: 'Work' },
  { time: '11:30 AM', title: 'Refactor AI Core modules', type: 'Code' },
  { time: '02:00 PM', title: 'Nasdaq Trading Session', type: 'Trading' },
  { time: '04:30 PM', title: 'Gym Fitness Workout', type: 'Health' },
]

interface WorkspaceRightColumnProps {
  activeCategory?: string
}

export default function WorkspaceRightColumn({ activeCategory }: WorkspaceRightColumnProps) {
  const navigate = useNavigate()
  const chatHistory = useConversationHistory()

  // Dynamic widgets visibility mapping state with persistence
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('jarvis_widget_visibility')
      if (stored) return JSON.parse(stored)
    } catch (_) {}
    return {
      missions: true,
      memory: true,
      files: true,
      calendar: true,
      devices: true,
      advisor: true,
      crm: true
    }
  })

  const [showCustomizer, setShowCustomizer] = useState(false)

  // Save visibility preferences
  const toggleWidget = (widgetId: string) => {
    const updated = { ...widgetVisibility, [widgetId]: !widgetVisibility[widgetId] }
    setWidgetVisibility(updated)
    localStorage.setItem('jarvis_widget_visibility', JSON.stringify(updated))
  }

  // File telemetry state
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  useEffect(() => {
    const updateFiles = () => {
      const latest = fileManager.getRecentFiles()
      setRecentFiles((prev) => {
        if (prev.length === latest.length && prev.every((val, idx) => val === latest[idx])) {
          return prev
        }
        return latest
      })
    }
    updateFiles()
    // Poll for updates to capture file manager opens/saves
    const timer = setInterval(updateFiles, 1000)
    return () => clearInterval(timer)
  }, [])

  // Dynamic Rule-based Advisor recommendations
  const [advisorTip, setAdvisorTip] = useState('Initiating system assessment...')
  const [notificationsCount, setNotificationsCount] = useState(dashboardStore.getState().notifications.length)

  useEffect(() => {
    return dashboardStore.subscribe(() => {
      setNotificationsCount(dashboardStore.getState().notifications.length)
    })
  }, [])

  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false)
  // Debounce and context refs to prevent runaway polling / duplicate calls
  const advisorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevContextRef = useRef<string>('')
  const lastAdvisorCallRef = useRef<number>(0)
  const isAdvisorInFlightRef = useRef<boolean>(false)
  // Error cooldown: after a provider failure, wait 60s before trying AI again
  const advisorErrorCooldownUntilRef = useRef<number>(0)

  useEffect(() => {
    if (!widgetVisibility.advisor) return

    if (advisorDebounce.current) clearTimeout(advisorDebounce.current)

    advisorDebounce.current = setTimeout(async () => {
      if (isAdvisorInFlightRef.current) return

      // Error cooldown — skip AI call until 60s has passed since last failure
      if (Date.now() < advisorErrorCooldownUntilRef.current) return

      const lastMsg = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null
      const recentFile = recentFiles.length > 0 ? recentFiles[0].split('/').pop() : null
      const notifCount = notificationsCount

      const contextParts: string[] = []
      if (notifCount > 0) contextParts.push(`${notifCount} active notification(s)`)
      if (lastMsg) contextParts.push(`Last interaction: "${lastMsg.content.slice(0, 60)}" (${lastMsg.role})`)
      if (recentFile) contextParts.push(`Recently edited: ${recentFile}`)

      const context = contextParts.length > 0 ? contextParts.join('. ') : 'System is idle.'

      const now = Date.now()
      const timeSinceLastCall = now - lastAdvisorCallRef.current
      if (context === prevContextRef.current && timeSinceLastCall < 30000) {
        return
      }

      prevContextRef.current = context
      lastAdvisorCallRef.current = now

      const prompt = `You are JARVIS OS Telemetry Advisor. Based on this dashboard context, give ONE short (max 15 words), actionable operational suggestion. No preamble, no explanation—just the tip itself.\n\nContext: ${context}`

      try {
        isAdvisorInFlightRef.current = true
        setIsAdvisorLoading(true)
        const tip = await aiRouter.generateResponse(prompt)
        advisorErrorCooldownUntilRef.current = 0 // reset cooldown on success
        setAdvisorTip(tip.trim().replace(/^["']|["']$/g, ''))
      } catch (_) {
        // Set 60s cooldown so we don't spam AI after a failure
        advisorErrorCooldownUntilRef.current = Date.now() + 60000
        // Fallback to rule-based tip on AI failure
        if (notifCount > 0) {
          setAdvisorTip('Telemetry alerts are active. Review notifications panel in header.')
        } else if (lastMsg?.role === 'user') {
          setAdvisorTip('Awaiting command completion. Optimize code structures via terminal.')
        } else if (recentFile) {
          setAdvisorTip(`Currently editing ${recentFile}. Run project build.`)
        } else {
          setAdvisorTip('System load is optimal. Request a code review or begin mission target.')
        }
      } finally {
        setIsAdvisorLoading(false)
        isAdvisorInFlightRef.current = false
      }
    }, 1500) // 1.5s debounce — prevents calling AI on every render

    return () => {
      if (advisorDebounce.current) clearTimeout(advisorDebounce.current)
    }
  }, [notificationsCount, chatHistory, recentFiles, widgetVisibility.advisor])

  const filteredMissions = ALL_MISSIONS.filter(m => {
    if (!activeCategory || activeCategory === 'ALL') return true
    if (activeCategory === 'FINANCE') return m.category.toLowerCase() === 'trading'
    return m.category.toLowerCase() === activeCategory.toLowerCase()
  })

  // Format Memory items dynamically
  const latestMemories = chatHistory
    .filter(m => m.role === 'user')
    .slice(-4)
    .reverse()
    .map(m => {
      const displayContent = m.content.length > 25 ? `${m.content.slice(0, 25)}...` : m.content
      return { title: displayContent, time: 'just now' }
    })

  // Fallback default memory items if history is empty
  const defaultMemories = [
    { title: "Asked about React hooks", time: "2 mins" },
    { title: "Project - Jarvis OS config", time: "1 hour" },
    { title: "Sync schedule with Alex", time: "Yesterday" },
    { title: "Best Python data libraries", time: "2 days" }
  ]

  const memoriesToRender = latestMemories.length > 0 ? latestMemories : defaultMemories

  return (
    <div className="w-full flex flex-col gap-4 select-none font-mono pb-2 relative">
      
      {/* Dynamic Widgets Layout Selector */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-shrink-0 px-1 relative">
        <span className="text-[9px] font-black tracking-widest text-[#FF0055]">WORKSPACE MATRIX</span>
        <div className="relative">
          <button 
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-bold text-white/50 hover:text-white transition-all"
          >
            <Sliders size={9} />
            <span>CUSTOMIZE</span>
          </button>
          
          {showCustomizer && (
            <div className="absolute right-0 top-6 w-44 bg-black/95 border border-white/10 rounded-lg p-2.5 z-40 shadow-2xl flex flex-col space-y-1.5 text-left">
              <span className="text-[8px] text-[#FF0055] font-black tracking-wider pb-1 border-b border-white/5">TOGGLE WIDGETS</span>
              {[
                { id: 'missions', name: 'Missions Panel' },
                { id: 'memory', name: 'Memory Logs' },
                { id: 'files', name: 'Recent Files' },
                { id: 'calendar', name: 'Calendar Schedule' },
                { id: 'devices', name: 'Devices Tray' },
                { id: 'advisor', name: 'AI Advisor' },
                { id: 'crm', name: 'CRM Telemetry' }
              ].map(w => (
                <label key={w.id} className="flex items-center space-x-2 text-[9px] text-white/70 hover:text-white cursor-pointer py-0.5">
                  <input 
                    type="checkbox" 
                    checked={widgetVisibility[w.id]} 
                    onChange={() => toggleWidget(w.id)}
                    className="rounded border-white/20 bg-transparent text-[#FF0055] focus:ring-0 w-3 h-3"
                  />
                  <span>{w.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. MISSIONS */}
      {widgetVisibility.missions && (
        <div className="flex-1 min-h-[160px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <CheckSquare size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">MISSIONS</span>
            </div>
            <button 
              onClick={() => navigate('/missions')}
              className="text-[9px] text-[#5A5670] hover:text-white hover:underline font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-2 pt-1.5 my-auto">
            {filteredMissions.map((mission, idx) => (
              <MissionRow 
                key={idx} 
                title={mission.title} 
                category={mission.category} 
                percentage={mission.percentage} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. MEMORY */}
      {widgetVisibility.memory && (
        <div className="flex-1 min-h-[120px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <Clock size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">MEMORY</span>
            </div>
            <button 
              onClick={() => navigate('/memory')}
              className="text-[9px] text-[#5A5670] hover:text-white hover:underline font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-1.5 pt-2 my-auto">
            {memoriesToRender.map((m, idx) => (
              <MemoryRow key={idx} title={m.title} time={m.time} />
            ))}
          </div>
        </div>
      )}

      {/* 3. RECENT FILES */}
      {widgetVisibility.files && (
        <div className="flex-1 min-h-[110px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <FileText size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">RECENT FILES</span>
            </div>
            <button 
              onClick={() => navigate('/coding')}
              className="text-[9px] text-[#5A5670] hover:text-white hover:underline font-semibold"
            >
              Open Lab
            </button>
          </div>
          <div className="space-y-1.5 pt-2 my-auto">
            {recentFiles.length === 0 ? (
              <div className="space-y-1.5">
                {fileManager.getFilesList().slice(0, 3).map((f: any) => (
                  <div key={f.path} className="flex items-center justify-between text-[10px] text-white/60">
                    <span className="truncate pr-4 text-white/70">{f.name}</span>
                    <span className="text-white/30 text-[8px] font-bold uppercase flex-shrink-0">.{f.extension}</span>
                  </div>
                ))}
              </div>
            ) : (
              recentFiles.map((path) => {
                const name = path.split('/').pop() || path
                const ext = name.split('.').pop() || 'src'
                return (
                  <div key={path} className="flex items-center justify-between text-[10px] text-white/85">
                    <span className="truncate pr-4 text-white/90">{name}</span>
                    <span className="text-[#00DFFF] text-[8px] font-bold uppercase flex-shrink-0">.{ext}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 4. CALENDAR */}
      {widgetVisibility.calendar && (
        <div className="flex-1 min-h-[120px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <Calendar size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">CALENDAR</span>
            </div>
            <span className="text-[8px] text-white/30 font-bold uppercase">TODAY Agenda</span>
          </div>
          <div className="space-y-1.5 pt-2 my-auto">
            {CALENDAR_EVENTS.map((ev, idx) => (
              <div key={idx} className="flex items-center justify-between text-[9px] border-b border-white/5 last:border-0 pb-1.5 last:pb-0">
                <div className="flex flex-col space-y-0.5 truncate pr-2">
                  <span className="text-white/85 tracking-wide truncate">{ev.title}</span>
                  <span className="text-white/30 text-[7px] font-bold uppercase">{ev.type}</span>
                </div>
                <span className="text-[#FF0055] font-black whitespace-nowrap flex-shrink-0">{ev.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DEVICES */}
      {widgetVisibility.devices && (
        <div className="flex-1 min-h-[120px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">DEVICES</span>
            <button 
              onClick={() => navigate('/devices')}
              className="text-[9px] text-[#5A5670] hover:text-white hover:underline font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-1 pt-2 my-auto">
            <DeviceRow name="Yatin's Android" icon={<Tablet size={12} />} />
            <DeviceRow name="Home PC" icon={<Laptop size={12} />} />
            <DeviceRow name="Smart Watch" icon={<Watch size={12} />} />
            <DeviceRow name="Echo Dot" icon={<Speaker size={12} />} />
          </div>
        </div>
      )}

      {/* 6. AI ADVISOR */}
      {widgetVisibility.advisor && (
        <div className="flex-1 min-h-[80px] flex flex-col justify-between border border-[#FF0055]/30 rounded-xl p-3.5 bg-[#FF0055]/5 shadow-[0_0_15px_rgba(255,0,85,0.02)]">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 flex-shrink-0">
            <BrainCircuit size={12} className="text-[#FF0055] animate-pulse" />
            <span className="text-[9px] font-black tracking-widest text-white/80 uppercase">TELEMETRY ADVISOR</span>
          </div>
          <div className="pt-2 my-auto flex items-start space-x-2 text-[9px] text-white/70 leading-normal font-mono">
            <Sparkles size={11} className={`mt-0.5 flex-shrink-0 ${isAdvisorLoading ? 'text-white/30 animate-pulse' : 'text-[#00DFFF]'}`} />
            <span className={isAdvisorLoading ? 'text-white/30 animate-pulse' : ''}>{isAdvisorLoading ? 'Consulting AI...' : advisorTip}</span>
          </div>
        </div>
      )}
      {/* 7. ECOSYSTEM TELEMETRY */}
      {widgetVisibility.crm && (
        <div className="flex-1 min-h-[140px] flex flex-col justify-between border border-white/10 rounded-xl p-3.5 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2 text-white/80">
              <Users size={12} className="text-[#FF0055]" />
              <span className="text-[10px] font-bold tracking-widest uppercase">ECOSYSTEM TELEMETRY</span>
            </div>
            <button 
              onClick={() => navigate('/crm')}
              className="text-[9px] text-[#5A5670] hover:text-white hover:underline font-semibold"
            >
              Portal
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 my-auto">
            <div className="bg-black/35 rounded border border-white/5 p-2 text-left">
              <div className="text-[7px] text-white/35 uppercase">Total Leads</div>
              <div className="text-xs font-black text-white mt-0.5">18</div>
            </div>
            <div className="bg-black/35 rounded border border-white/5 p-2 text-left">
              <div className="text-[7px] text-white/35 uppercase">Ecosystem Val</div>
              <div className="text-xs font-black text-[#00FFCC] mt-0.5">₹12,41,000</div>
            </div>
            <div className="bg-black/35 rounded border border-white/5 p-2 text-left">
              <div className="text-[7px] text-white/35 uppercase">Hot Ratio</div>
              <div className="text-xs font-black text-white mt-0.5">39%</div>
            </div>
            <div className="bg-black/35 rounded border border-white/5 p-2 text-left">
              <div className="text-[7px] text-white/35 uppercase">Active Agents</div>
              <div className="text-xs font-black text-white mt-0.5">5</div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
