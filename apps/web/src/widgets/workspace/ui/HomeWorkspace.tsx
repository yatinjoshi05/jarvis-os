import { useState } from 'react'
import WorkspaceLeftColumn from './WorkspaceLeftColumn'
import WorkspaceRightColumn from './WorkspaceRightColumn'
import MusicPlayer from './MusicPlayer'
import ConsoleAndDock from './ConsoleAndDock'
import WeatherWidget from './WeatherWidget'
import { AICore } from '../../../entities/ai-core'

export default function HomeWorkspace() {
  const [activeCategory, setActiveCategory] = useState('ALL')

  return (
    <div className="w-full h-full grid grid-cols-[20%_1fr_22%] gap-5 overflow-hidden font-mono select-none">

      {/* LEFT PANEL */}

      <div className="min-w-0 min-h-0 flex flex-col">

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
          <WorkspaceLeftColumn />
        </div>

        <div className="mt-3 flex-shrink-0">
          <MusicPlayer />
        </div>

      </div>

      {/* CENTER */}

      <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">

        {/* CATEGORY BAR */}

        <div className="h-11 flex items-center justify-center flex-shrink-0">

          <div className="flex items-center gap-2">

            {[
              'ALL',
              'WORK',
              'SYSTEM',
              'WEB',
              'CODE',
              'FINANCE',
              'PERSONAL',
            ].map((item) => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={
                  activeCategory === item
                    ? 'px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF0055] to-[#FF5500] text-white text-[10px] font-bold tracking-[0.2em] shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                    : 'px-4 py-1.5 rounded-full border border-white/10 bg-black/20 text-white/60 hover:text-white hover:border-[#FF0055]/40 transition-all text-[10px] tracking-[0.2em]'
                }
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* AI CORE */}

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">

          <AICore />

        </div>

        {/* COMMAND */}

        <div className="pt-2 flex-shrink-0">

          <ConsoleAndDock />

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="min-w-0 min-h-0 flex flex-col">

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
          <WorkspaceRightColumn activeCategory={activeCategory} />
        </div>

        <div className="mt-3 flex-shrink-0">
          <WeatherWidget />
        </div>

      </div>

    </div>
  )
}