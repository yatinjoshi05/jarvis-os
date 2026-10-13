import { Brain, ChevronRight } from 'lucide-react'
import { Panel } from '../../../shared/ui/panel'

export default function MemoryCard() {
  return (
    <Panel title="Memory Banks" icon={Brain}>
      <div className="space-y-3 text-xs flex-1">
        <div className="flex justify-between">
          <span className="text-white/60">RECALL INDEX:</span>
          <span className="text-[#00DFFF] font-bold">1,842 ENTRIES</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">SYNAPSE BANDWIDTH:</span>
          <span className="text-[#00DFFF] font-bold">4.2 TB/S</span>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[10px] text-white/40">
            <span>STORAGE UTILIZATION</span>
            <span>42%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="w-[42%] h-full bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] shadow-[0_0_8px_rgba(0,223,255,0.4)]" />
          </div>
        </div>
      </div>
      <button className="flex items-center justify-between text-[10px] text-[#5A5670] hover:text-white font-bold tracking-wider hover:underline pt-4 uppercase">
        <span>Access Memory Core</span>
        <ChevronRight size={12} />
      </button>
    </Panel>
  )
}
