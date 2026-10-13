import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import Sidebar from '../../../widgets/sidebar/ui/Sidebar'
import Topbar from '../../../widgets/topbar/ui/Topbar'
import { conversationManager } from '../../../shared/ai/ConversationManager'
import { assistantState } from '../../../shared/ai/AssistantState'
import { textToSpeechManager } from '../../../shared/ai/TextToSpeechManager'
import MicrophoneController from '../../../shared/ai/MicrophoneController'
import SpeechRecognitionController from '../../../shared/ai/SpeechRecognitionController'
import { getWasDirty } from '../../../shared/utils/storageShim'
import { voiceCommandHandler } from '../../../shared/ai/VoiceCommandHandler'

import { sidebarSettings } from '../../../shared/theme/SidebarSettings'

export default function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sbState, setSbState] = useState(() => sidebarSettings.getState())

  useEffect(() => {
    const unsub = sidebarSettings.subscribe((updated) => setSbState(updated))
    return unsub
  }, [])

  // Register voice command handler with router navigate (once only)
  useEffect(() => {
    voiceCommandHandler.register(navigate)
  }, [navigate])

  // Track page navigation changes to persist last active path
  useEffect(() => {
    localStorage.setItem('jarvis_last_page', location.pathname)
  }, [location])

  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__)

    // Crash recovery session restoration
    const checkSessionRestore = () => {
      if (getWasDirty()) {
        console.log('[CrashRecovery] Unclean shutdown detected. Restoring session...')
        const savedConv = localStorage.getItem('jarvis_last_conversation')
        if (savedConv) {
          conversationManager.import(savedConv)
        }
        const lastPage = localStorage.getItem('jarvis_last_page')
        if (lastPage && lastPage !== window.location.pathname) {
          navigate(lastPage)
        }
      }
    }
    checkSessionRestore()

    // --- A. KEYBOARD SHORTCUTS (GLOBAL FRONTEND LISTENERS) ---
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 1. ESC: Reset assistant speaking/thinking/prompt
      if (e.key === 'Escape') {
        textToSpeechManager.stop()
        assistantState.reset()
      }
      
      // 2. Ctrl+N: Clear chat (New Chat)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault()
        conversationManager.clear()
        navigate('/chat')
      }

      // 3. Ctrl+K: Focus console input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.getElementById('console-input')?.focus()
      }

      // 4. Ctrl+,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }

      // 5. F11: Fullscreen (Native-aware toggle)
      if (e.key === 'F11') {
        e.preventDefault()
        if (isTauri) {
          try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            const appWindow = getCurrentWindow()
            const isFS = await appWindow.isFullscreen()
            await appWindow.setFullscreen(!isFS)
          } catch (e) {
            console.error('Failed to toggle fullscreen:', e)
          }
        }
      }

      // 6. Ctrl+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // --- B. TAURI-ONLY WINDOW & NAV EVENTS ---
    const unlistens: (() => void)[] = []
    let splashTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false
    
    if (isTauri) {
      // Attempt up to 3 retries over 3 seconds max for backend health check.
      // If backend is still starting, proceed gracefully to reveal main window UI.
      const waitForBackend = async () => {
        const maxAttempts = 3
        let attempt = 0

        while (!cancelled && attempt < maxAttempts) {
          attempt++
          try {
            const response = await fetch('/api/health', {
              signal: AbortSignal.timeout(1_000),
            })
            if (response.ok) return true
          } catch {
            // Retry until maxAttempts
          }
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        console.warn(`[Shell] Backend health check passed attempt deadline (${maxAttempts} attempts). Revealing main window UI.`)
        return true
      }

      // Hard safety timeout: Guaranteed splashscreen close after 5000ms max
      const forceSplashCloseTimer = setTimeout(async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          await invoke('close_splashscreen')
        } catch (_) {}
      }, 5000)

      splashTimer = setTimeout(async () => {
        try {
          await waitForBackend()
          if (forceSplashCloseTimer) clearTimeout(forceSplashCloseTimer)
          const { invoke } = await import('@tauri-apps/api/core')
          await invoke('close_splashscreen')
        } catch (e) {
          console.error('Failed to close splash screen:', e)
        }
      }, 1000)

      // 2. Register IPC navigation listeners from Menu/Tray
      const setupIPCListeners = async () => {
        try {
          const { listen } = await import('@tauri-apps/api/event')
          
          const u1 = await listen<string>('navigate', (event) => {
            navigate(event.payload)
          })
          const u2 = await listen('new-chat', () => {
            conversationManager.clear()
            navigate('/chat')
          })
          const u3 = await listen('toggle-sidebar', () => {
            setSidebarOpen(prev => !prev)
          })
          const u4 = await listen('stop-ai', () => {
            textToSpeechManager.stop()
            assistantState.reset()
          })
          const u5 = await listen('show-about', () => {
            alert("JARVIS OS Desktop Shell v1.0.0\nRunning on Tauri framework")
          })
          
          unlistens.push(u1, u2, u3, u4, u5)
        } catch (e) {
          console.error('Failed to setup Tauri event listeners:', e)
        }
      }
      setupIPCListeners()

      return () => {
        cancelled = true
        if (splashTimer) clearTimeout(splashTimer)
        window.removeEventListener('keydown', handleKeyDown)
        unlistens.forEach(un => un())
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate])

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex">
      {/* Persistent voice runtime: survives workspace route changes. */}
      <SpeechRecognitionController />
      <Canvas
        aria-hidden="true"
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      >
        <MicrophoneController />
      </Canvas>
      {/* LEFT SIDEBAR (Toggleable & Custom Width) */}
      <div
        className={`h-full flex-shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out ${
          sidebarOpen ? '' : 'w-0 overflow-hidden'
        }`}
        style={{ width: sidebarOpen ? `${sbState.sidebarWidthPx}px` : '0px' }}
      >
        <Sidebar />
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-hidden bg-black px-3 pt-2 pb-2">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
