// ─────────────────────────────────────────────
// JARVIS OS — MemoryTimeline
// Grouped, clickable timeline — preserves frozen design exactly
// ─────────────────────────────────────────────

import { memo } from 'react'
import { Pin, Star } from 'lucide-react'
import { MemoryGroup } from '../model/types'
import { useMemoryStore } from '../model/store'
import { getTypeTone, formatTimestamp } from '../model/utils'
import { ContextMenuState } from '../model/types'

interface MemoryTimelineProps {
  groups: MemoryGroup[]
  selectedId: string | null
  onContextMenu: (e: React.MouseEvent, memoryId: string) => void
}

/** Renders one date-bucketed group with the vertical connector line */
function TimelineGroup({
  group,
  selectedId,
  onContextMenu,
}: {
  group: MemoryGroup
  selectedId: string | null
  onContextMenu: (e: React.MouseEvent, memoryId: string) => void
}) {
  const setSelected = useMemoryStore((s) => s.setSelected)

  return (
    <div>
      {/* Group label */}
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-white/25">
        {group.label}
      </p>

      {/* Entries with connector line */}
      <div className="relative pl-6 space-y-6">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" />

        {group.entries.map((entry) => {
          const tone = getTypeTone(entry.type)
          const ts = formatTimestamp(entry.createdAt)
          const isSelected = selectedId === entry.id

          return (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              onClick={() => setSelected(entry.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                onContextMenu(e, entry.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(entry.id)
              }}
              className={`relative flex cursor-pointer items-start justify-between gap-4 rounded-lg p-1 -ml-1 transition-colors group outline-none focus-visible:ring-1 focus-visible:ring-pink-500/50 ${
                isSelected
                  ? 'bg-pink-500/5 ring-1 ring-pink-500/20'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Timeline node dot */}
              <div
                className={`absolute -left-[19px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${tone.nodeRing}`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              </div>

              {/* Title + badge + summary */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-xs font-bold tracking-tight transition-colors ${
                      isSelected
                        ? 'text-pink-300'
                        : 'text-white group-hover:text-pink-300'
                    }`}
                  >
                    {entry.title}
                  </h4>
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-medium ${tone.bg} ${tone.text}`}
                  >
                    {tone.label}
                  </span>
                  {entry.pinned && (
                    <Pin size={10} className="flex-shrink-0 text-amber-400" />
                  )}
                  {entry.favourite && (
                    <Star size={10} className="flex-shrink-0 text-pink-400" />
                  )}
                </div>
                <p className="mt-1 max-w-xl truncate text-[11px] leading-relaxed text-white/50">
                  {entry.summary}
                </p>
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <p className="font-mono text-[10px] leading-snug text-white/40">
                  {ts.line1}
                </p>
                <p className="font-mono text-[10px] leading-snug text-white/30">
                  {ts.line2}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MemoTimelineGroup = memo(TimelineGroup)

export function MemoryTimeline({
  groups,
  selectedId,
  onContextMenu,
}: MemoryTimelineProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <MemoTimelineGroup
          key={group.label}
          group={group}
          selectedId={selectedId}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  )
}

export type { ContextMenuState }
