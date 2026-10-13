import { Target, ChevronRight } from 'lucide-react'
import { Panel } from '../../../shared/ui/panel'

export default function MissionCard() {
  return (
    <Panel title="Missions Control" icon={Target}>
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between p-2.5 rounded bg-[#00DFFF]/5 border border-[#00DFFF]/15 hover:border-[#00DFFF]/40 transition-all duration-300">
          <div>
            <div className="text-xs font-bold text-white uppercase">Operation Horizon</div>
            <div className="text-[9px] text-white/40">Task 5.1 & 3.0</div>
          </div>
          <span className="text-[9px] font-bold text-[#00FFCC] px-2 py-0.5 border border-[#00FFCC]/40 bg-[#00FFCC]/10 rounded uppercase">
            ACTIVE
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5 opacity-70 hover:opacity-100 transition-all duration-300">
          <div>
            <div className="text-xs font-bold text-white uppercase">Secure Local Node</div>
            <div className="text-[9px] text-white/40">Integrate Desktop Wrapper</div>
          </div>
          <span className="text-[9px] font-bold text-white/40 px-2 py-0.5 border border-white/20 bg-white/5 rounded uppercase">
            STANDBY
          </span>
        </div>
      </div>
      <button className="flex items-center justify-between text-[10px] text-[#5A5670] hover:text-white font-bold tracking-wider hover:underline pt-4 uppercase">
        <span>View Mission Log</span>
        <ChevronRight size={12} />
      </button>
    </Panel>
  )
}
