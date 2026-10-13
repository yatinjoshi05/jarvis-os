import { Zap } from 'lucide-react'

export default function SidebarLogo() {
  return (
    <div className="flex items-center space-x-3.5 px-3 select-none font-mono">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#00DFFF]/40 bg-[#00DFFF]/10 text-[#00DFFF] shadow-[0_0_10px_rgba(0,223,255,0.15)]">
        <Zap size={16} />
      </div>
      <div className="flex flex-col">
        <span className="bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] bg-clip-text text-transparent font-black tracking-widest text-sm leading-none">JARVIS OS</span>
        <span className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">SYSTEM CONTROL</span>
      </div>
    </div>
  )
}
