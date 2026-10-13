import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function SidebarFooter() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <Link 
      to="/settings" 
      className="mx-3 px-3 py-3 flex items-center space-x-3 select-none font-mono hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full border border-[#00DFFF]/40 bg-black flex items-center justify-center shadow-[0_0_10px_rgba(0,223,255,0.05)]">
        <span className="text-[#00DFFF] text-xs font-black">J</span>
      </div>
      {/* Profile info */}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          JARVIS OS
        </span>
        <span className="flex items-center space-x-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#00FFCC]' : 'bg-[#FF5500] animate-pulse'}`} />
          <span className={`text-[9px] uppercase tracking-widest font-semibold ${isOnline ? 'text-[#00FFCC]' : 'text-[#FF5500]'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </span>
      </div>
    </Link>
  )
}
