import { Activity, ShieldCheck } from 'lucide-react'

export default function SidebarStatus() {
  return (
    <div className="mx-3 p-3.5 rounded-xl border border-[#5A5670]/20 bg-black/40 text-[10px] font-mono select-none space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#5A5670]/15 pb-2">
        <div className="flex items-center space-x-1.5">
          <Activity size={12} className="text-[#00DFFF]" />
          <span className="text-[#00DFFF] font-bold uppercase tracking-wider">AI Core Status</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] animate-pulse" />
          <span className="text-white/60 font-semibold">ACTIVE</span>
        </div>
      </div>

      {/* Metric details */}
      <div className="space-y-1.5 text-white/50 leading-relaxed">
        <div className="flex justify-between">
          <span>MODEL ENGINE:</span>
          <span className="text-white font-semibold">JARVIS-V5</span>
        </div>
        <div className="flex justify-between">
          <span>QUANTUM LINK:</span>
          <span className="text-[#00DFFF] font-semibold">99.8%</span>
        </div>
        <div className="flex justify-between">
          <span>SECURE AUTH:</span>
          <span className="text-white flex items-center space-x-0.5">
            <ShieldCheck size={10} className="text-[#00DFFF]" />
            <span className="text-[9px]">L5</span>
          </span>
        </div>
      </div>
    </div>
  )
}
