import { Sun } from 'lucide-react'

export default function WeatherWidget() {
  return (
    <div className="w-full border border-white/10 rounded-xl p-3 bg-black/40 flex items-center justify-between h-16 flex-shrink-0 font-mono select-none text-white">
      <div className="flex items-center space-x-3">
        <Sun size={20} className="text-[#FF8800] animate-spin" style={{ animationDuration: '40s' }} />
        <div className="flex flex-col">
          <span className="text-sm font-black text-white leading-none">28°C</span>
          <span className="text-[8px] text-white/40 mt-1">Partly Cloudy</span>
          <span className="text-[8px] text-white/30">Haldwani, India</span>
        </div>
      </div>
      <div className="text-right text-[8px] text-white/40 flex flex-col justify-center h-full">
        <span className="font-bold text-[#00DFFF]">009%</span>
        <span>HUMIDITY</span>
      </div>
    </div>
  )
}
