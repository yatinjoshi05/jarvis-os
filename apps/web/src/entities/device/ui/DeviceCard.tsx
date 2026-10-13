import { Network } from 'lucide-react'
import { Panel } from '../../../shared/ui/panel'

export default function DeviceCard() {
  return (
    <Panel title="Hardware Devices" icon={Network}>
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between text-xs p-2 rounded border border-[#00FFCC]/10 bg-[#00FFCC]/5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
            <span className="text-white">REACT_CLIENT_LOCAL</span>
          </div>
          <span className="text-[10px] text-[#00FFCC] font-bold">ONLINE</span>
        </div>

        <div className="flex items-center justify-between text-xs p-2 rounded border border-white/5 opacity-60">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-white/60">DESKTOP_WRAPPER_IPC</span>
          </div>
          <span className="text-[10px] text-white/40">OFFLINE</span>
        </div>

        <div className="flex items-center justify-between text-xs p-2 rounded border border-white/5 opacity-60">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-white/60">MOBILE_AGENT_STN</span>
          </div>
          <span className="text-[10px] text-white/40">OFFLINE</span>
        </div>
      </div>
    </Panel>
  )
}
