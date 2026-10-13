interface ModulePlaceholderProps {
  moduleName: string
}

export default function ModulePlaceholder({ moduleName }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 font-mono select-none text-center">
      <div className="w-16 h-16 rounded-full border border-voltage/30 bg-voltage/5 flex items-center justify-center animate-pulse">
        <span className="text-voltage text-lg font-bold">//</span>
      </div>
      <h3 className="text-lg font-black tracking-widest bg-gradient-to-r from-[#00DFFF] to-[#FF00FF] bg-clip-text text-transparent uppercase">
        {moduleName} MODULE ACTIVE
      </h3>
      <p className="text-xs text-white/40 uppercase tracking-wider">
        Core system standby // waiting for active directive
      </p>
    </div>
  )
}
