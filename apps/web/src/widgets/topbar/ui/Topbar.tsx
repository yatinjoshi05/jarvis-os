import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Settings, Minus, Square, X, Bell, Trash2, Check, MicOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { dashboardStore } from '../../../shared/dashboard/store'
import { notificationManager } from '../../../shared/dashboard/notification'
import { Notification } from '../../../shared/dashboard/interfaces'
import { useAssistantState, voiceManager, aiResponseManager } from '../../../shared/ai/AIManager'
import { identitySettings } from '../../../shared/ai/IdentitySettings'
import { GlobeDebugPanel, GlobeStatusButton } from '../../../entities/globe'

// ─── Greeting time bands — adjust boundaries here if needed ───────────────────
function getGreetingPrefix(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 21) return 'Good Evening'
  return 'Good Night'
}

function formatClock(date: Date): string {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dayNum = date.getDate()
  const monthName = date.toLocaleDateString('en-US', { month: 'long' })
  const yearNum = date.getFullYear()
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return `${dayName}, ${dayNum} ${monthName} ${yearNum} • ${timePart}`
}

// Track session-level greeting playthrough so route changes never re-trigger it.
// A module-level variable persists for the lifetime of the JS bundle (i.e. the session).
let greetingPlayedThisSession = false

export default function Topbar() {
  const navigate = useNavigate()

  // ── Identity ────────────────────────────────────────────────────────────────
  const [userName, setUserName] = useState<string>(
    () => identitySettings.getState().identity.userName || 'Commander'
  )

  // ── Clock / Greeting state ───────────────────────────────────────────────
  // phase: 'greeting' → showing greeting text
  //        'clock'    → showing live clock
  const [phase, setPhase] = useState<'greeting' | 'clock'>(
    greetingPlayedThisSession ? 'clock' : 'greeting'
  )
  const [greetingText, setGreetingText] = useState<string>(() => {
    const h = new Date().getHours()
    const name = identitySettings.getState().identity.userName || 'Commander'
    return `${getGreetingPrefix(h)}, ${name}.`
  })
  const [clockStr, setClockStr] = useState<string>(() => formatClock(new Date()))

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>(
    dashboardStore.getState().notifications
  )
  const [showTray, setShowTray] = useState(false)
  const [showGlobeDiagnostics, setShowGlobeDiagnostics] = useState(false)

  // ── Voice ──────────────────────────────────────────────────────────────────
  const { listening, muted, permissionDenied } = useAssistantState()

  // ── Window maximize tracker ────────────────────────────────────────────────
  const [isMaximized, setIsMaximized] = useState(false)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Identity subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = identitySettings.subscribe((profile) => {
      setUserName(profile.identity.userName || 'Commander')
    })
    return unsub
  }, [])

  // ── Notifications subscription ─────────────────────────────────────────────
  useEffect(() => {
    return dashboardStore.subscribe(() => {
      setNotifications([...dashboardStore.getState().notifications])
    })
  }, [])

  // ── Greeting → Clock sequence (once per session) ───────────────────────────
  useEffect(() => {
    // Kick off live clock ticker immediately regardless of phase
    clockIntervalRef.current = setInterval(() => {
      setClockStr(formatClock(new Date()))
    }, 1000)

    if (!greetingPlayedThisSession) {
      greetingPlayedThisSession = true
      // Hold greeting for 7.5 seconds, then swap to clock permanently
      greetingTimeoutRef.current = setTimeout(() => {
        setPhase('clock')
      }, 7500) // 400ms fade-in + 6700ms hold + 400ms fade-out handled by AnimatePresence
    }

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current)
    }
  }, [])

  // ── Sync greeting text when userName resolves ──────────────────────────────
  useEffect(() => {
    const h = new Date().getHours()
    setGreetingText(`${getGreetingPrefix(h)}, ${userName}.`)
  }, [userName])

  // ── Mic handler ────────────────────────────────────────────────────────────
  const handleMicClick = () => {
    if (listening) {
      voiceManager.stopListening()
      aiResponseManager.respond()
    } else {
      voiceManager.startListening()
    }
  }

  const checkTauriRuntime = () =>
    typeof window !== 'undefined' &&
    (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__)

  // ── Sync initial window maximize state & listen for resize events ──────────
  useEffect(() => {
    if (!checkTauriRuntime()) return
    let unlisten: (() => void) | undefined
    ;(async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        const initialMax = await win.isMaximized()
        setIsMaximized(initialMax)
        unlisten = await win.onResized(async () => {
          const max = await win.isMaximized()
          setIsMaximized(max)
        })
      } catch (e) {
        console.warn('[Topbar] Failed to listen to window resize:', e)
      }
    })()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const handleMinimize = async () => {
    if (!checkTauriRuntime()) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().minimize()
    } catch (e) {
      console.warn('[Topbar] Minimize failed:', e)
    }
  }

  const handleMaximizeToggle = async () => {
    if (!checkTauriRuntime()) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      const maximized = await win.isMaximized()
      if (maximized) {
        await win.unmaximize()
        setIsMaximized(false)
      } else {
        await win.maximize()
        setIsMaximized(true)
      }
    } catch (e) {
      console.warn('[Topbar] Maximize toggle failed:', e)
    }
  }

  const handleClose = async () => {
    if (!checkTauriRuntime()) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().close()
    } catch (e) {
      console.warn('[Topbar] Close failed:', e)
    }
  }

  // ── Notification helpers ───────────────────────────────────────────────────
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  // ── Framer Motion variants ─────────────────────────────────────────────────
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.45, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  }

  return (
    <header
      className="relative w-full h-12 bg-black border-b border-white/5 flex items-center justify-between px-6 text-white font-mono select-none flex-shrink-0 z-30"
      // data-tauri-drag-region enables dragging the custom titlebar on the non-interactive area
      data-tauri-drag-region
    >

      {/* LEFT — JARVIS OS label + version */}
      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] bg-clip-text text-transparent font-black tracking-widest text-sm uppercase">
            JARVIS OS
          </span>
          <span className="text-[10px] text-white/40 tracking-wider">
            v1.0.0
          </span>
        </div>
      </div>

      {/* CENTER — Greeting → Live Clock with Framer Motion fade transition */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none">
        <AnimatePresence mode="wait">
          {phase === 'greeting' ? (
            <motion.div
              key="greeting"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-xs uppercase tracking-[0.2em] font-bold text-white/80 whitespace-nowrap"
            >
              {greetingText}
            </motion.div>
          ) : (
            <motion.div
              key="clock"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-xs text-white/70 font-medium tracking-wide whitespace-nowrap"
            >
              {clockStr}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT — Mic, Bell, Settings gear, Window Controls */}
      <div className="flex items-center space-x-6 text-[10px] font-bold">

        <div className="flex items-center space-x-3 text-white/50 relative">

          <GlobeStatusButton onOpenDiagnostics={() => setShowGlobeDiagnostics(true)} />

          {/* MIC — already fully wired to voice pipeline */}
          <button
            onClick={handleMicClick}
            title={
              listening
                ? 'Listening… (click to stop)'
                : permissionDenied
                ? 'Microphone permission denied'
                : 'Start voice command'
            }
            className={`transition-all p-1 rounded ${
              listening
                ? 'text-[#FF0055] bg-[#FF0055]/15 animate-pulse shadow-[0_0_10px_rgba(255,0,85,0.4)]'
                : permissionDenied || muted
                ? 'text-red-400 opacity-60'
                : 'hover:text-[#FF0055]'
            }`}
          >
            {muted ? <MicOff size={13} /> : <Mic size={13} />}
          </button>

          {/* BELL — notification tray (unchanged) */}
          <button
            onClick={() => setShowTray(!showTray)}
            className="relative hover:text-[#FF0055] transition-colors"
          >
            <Bell size={13} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF0055] text-white text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* SETTINGS GEAR — navigates to /settings (consolidates old CUSTOMIZE behavior) */}
          <button
            onClick={() => navigate('/settings')}
            title="Settings & Workspace Customization"
            className="hover:text-[#FF0055] transition-colors"
          >
            <Settings size={13} />
          </button>
        </div>

        {/* WINDOW CONTROLS — Minimize / Maximize-Restore / Close (Tauri v2) */}
        <div className="flex items-center space-x-3 text-white/30 pl-4 border-l border-white/10">
          <button
            onClick={handleMinimize}
            title="Minimize"
            className="hover:text-white transition-colors"
          >
            <Minus size={11} />
          </button>

          <button
            onClick={handleMaximizeToggle}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="hover:text-white transition-colors"
          >
            <Square size={9} />
          </button>

          <button
            onClick={handleClose}
            title="Close"
            className="hover:text-red-500 transition-colors"
          >
            <X size={12} />
          </button>
        </div>

      </div>

      {/* NOTIFICATIONS TRAY DROPDOWN — unchanged */}
      {showTray && (
        <div className="absolute right-24 top-12 w-80 max-h-96 overflow-y-auto bg-black/95 border border-white/10 rounded-xl backdrop-blur-xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] p-3.5 z-50 flex flex-col space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-black tracking-widest text-[#FF0055]">ALERT CONSOLE</span>
            {notifications.length > 0 && (
              <button
                onClick={() => notificationManager.clearAll()}
                className="text-[8px] text-white/35 hover:text-white transition-colors"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-[9px] text-white/40 text-center py-6">
                SYSTEM telemetry green. No pending alerts.
              </div>
            ) : (
              [...notifications].reverse().map((n: Notification) => (
                <div
                  key={n.id}
                  onClick={() => notificationManager.markAsRead(n.id)}
                  className={`group relative p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-350 ${
                    n.isRead
                      ? 'bg-white/[0.01] border-white/5 opacity-60'
                      : 'bg-[#FF0055]/5 border-[#FF0055]/20 shadow-[0_0_10px_rgba(255,0,85,0.03)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-black tracking-wide ${
                        n.type === 'success'
                          ? 'text-[#00FFCC]'
                          : n.type === 'error'
                          ? 'text-[#FF0055]'
                          : 'text-[#00DFFF]'
                      }`}
                    >
                      {n.title}
                    </span>
                    <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            notificationManager.markAsRead(n.id)
                          }}
                          className="text-white/40 hover:text-[#00FFCC]"
                        >
                          <Check size={10} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          notificationManager.dismiss(n.id)
                        }}
                        className="text-white/40 hover:text-[#FF0055]"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/60 leading-normal mt-1 pr-6">{n.message}</p>
                  <div className="text-[7px] text-white/30 text-right mt-1.5">
                    {new Date(n.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <GlobeDebugPanel open={showGlobeDiagnostics} onClose={() => setShowGlobeDiagnostics(false)} />
    </header>
  )
}
