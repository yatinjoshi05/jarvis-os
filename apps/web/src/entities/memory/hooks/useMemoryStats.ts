// ─────────────────────────────────────────────
// JARVIS OS — useMemoryStats
// Derived memory statistics for stat cards + donut chart
// ─────────────────────────────────────────────

import { useMemo } from 'react'
import { useMemoryStore } from '../model/store'
import { MemoryStats, MemoryType } from '../model/types'
import { getTypeTone } from '../model/utils'

const MEMORY_TYPES: MemoryType[] = [
  'mission',
  'knowledge',
  'conversation',
  'file',
  'preference',
  'project',
  'manual',
]

const WEEK_MS = 7 * 86_400_000

export interface DonutSegment {
  type: MemoryType
  arcColor: string
  dotColor: string
  label: string
  dash: number
  offset: number
  pct: number
  count: number
}

export interface UseMemoryStatsResult {
  stats: MemoryStats
  donutSegments: DonutSegment[]
  legendItems: Array<{ type: MemoryType; label: string; dotColor: string; pct: string }>
}

/**
 * Computes all derived statistics from the raw memory list.
 * Memoised — only recomputes when memories array changes.
 */
export function useMemoryStats(): UseMemoryStatsResult {
  const memories = useMemoryStore((s) => s.memories)

  const stats: MemoryStats = useMemo(() => {
    const now = Date.now()
    const nonArchived = memories.filter((m) => !m.archived)

    const byType = MEMORY_TYPES.reduce(
      (acc, type) => {
        acc[type] = nonArchived.filter((m) => m.type === type).length
        return acc
      },
      {} as Record<MemoryType, number>
    )

    // Tag frequency map
    const tagFreq: Record<string, number> = {}
    for (const m of nonArchived) {
      for (const tag of m.tags) {
        tagFreq[tag] = (tagFreq[tag] ?? 0) + 1
      }
    }
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([tag]) => tag)

    // Fallback top tags when no tags exist yet
    const defaultTags = ['React', 'TypeScript', 'Investment', 'Dashboard', 'Financial Planning']

    return {
      total: nonArchived.length,
      byType,
      pinned: nonArchived.filter((m) => m.pinned).length,
      archived: memories.filter((m) => m.archived).length,
      favourites: nonArchived.filter((m) => m.favourite).length,
      lastSync: Date.now(),
      weeklyDelta: nonArchived.filter((m) => now - m.createdAt < WEEK_MS).length,
      topTags: topTags.length > 0 ? topTags : defaultTags,
    }
  }, [memories])

  const donutSegments: DonutSegment[] = useMemo(() => {
    const total = stats.total
    if (total === 0) return []

    let cumulativeOffset = 0
    const segments: DonutSegment[] = []

    for (const type of MEMORY_TYPES) {
      const count = stats.byType[type] ?? 0
      if (count === 0) continue
      const pct = (count / total) * 100
      const tone = getTypeTone(type)
      segments.push({
        type,
        arcColor: tone.arcColor,
        dotColor: tone.dotColor,
        label: tone.label,
        dash: pct,
        offset: -cumulativeOffset,
        pct: Math.round(pct),
        count,
      })
      cumulativeOffset += pct
    }

    return segments
  }, [stats])

  const legendItems = useMemo(
    () =>
      donutSegments.map((seg) => ({
        type: seg.type,
        label: seg.label,
        dotColor: seg.dotColor,
        pct: seg.pct < 1 ? '<1' : String(seg.pct),
      })),
    [donutSegments]
  )

  return { stats, donutSegments, legendItems }
}
