import React from 'react'
import { LucideIcon } from 'lucide-react'

interface PanelProps {
  children: React.ReactNode
  className?: string
  title?: string
  icon?: LucideIcon
}

export default function Panel({ children, className = '', title, icon: Icon }: PanelProps) {
  return (
    <div className={`bg-black border border-voltage/20 rounded-xl p-5 flex flex-col space-y-4 font-mono select-none ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 border-b border-voltage/10 pb-3">
          {Icon && <Icon size={16} className="text-voltage" />}
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
