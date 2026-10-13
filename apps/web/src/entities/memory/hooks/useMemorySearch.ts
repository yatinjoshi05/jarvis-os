// ─────────────────────────────────────────────
// JARVIS OS — useMemorySearch
// Debounced search + filter composition + date grouping
// ─────────────────────────────────────────────

import { useMemo, useState, useEffect } from 'react'
import { useMemoryStore } from '../model/store'
import { MemoryEntry, MemoryGroup } from '../model/types'

const DEBOUNCE_MS = 200
const DAY_MS = 86_400_000

/** Date-bucket a sorted list of entries into named groups */
function groupByDate(entries: MemoryEntry[]): MemoryGroup[] {
  const now = Date.now()
  const groups: MemoryGroup[] = [
    { label: 'Today', entries: [] },
    { label: 'Yesterday', entries: [] },
    { label: 'Last 7 Days', entries: [] },
    { label: 'Last 30 Days', entries: [] },
    { label: 'Older', entries: [] },
  ]

  for (const entry of entries) {
    const age = now - entry.createdAt
    if (age < DAY_MS) {
      groups[0].entries.push(entry)
    } else if (age < 2 * DAY_MS) {
      groups[1].entries.push(entry)
    } else if (age < 7 * DAY_MS) {
      groups[2].entries.push(entry)
    } else if (age < 30 * DAY_MS) {
      groups[3].entries.push(entry)
    } else {
      groups[4].entries.push(entry)
    }
  }

  // Only return groups that have entries
  return groups.filter((g) => g.entries.length > 0)
}

export interface UseMemorySearchResult {
  filteredMemories: MemoryEntry[]
  groupedMemories: MemoryGroup[]
  isFiltering: boolean
}

/**
 * Derives a filtered + grouped view of the memory store.
 * - 200ms debounce on the raw search query
 * - Combines type-filter and text-search
 * - Groups results by date bucket (Today / Yesterday / …)
 * - Excludes archived entries unless the filter is 'archived'
 */
export function useMemorySearch(): UseMemorySearchResult {
  const memories = useMemoryStore((s) => s.memories)
  const activeFilter = useMemoryStore((s) => s.activeFilter)
  const rawQuery = useMemoryStore((s) => s.searchQuery)

  // Debounce the raw search query
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(rawQuery), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [rawQuery])

  const filteredMemories = useMemo(() => {
    let result = memories

    // Apply type / meta filter
    if (activeFilter === 'pinned') {
      result = result.filter((m) => m.pinned && !m.archived)
    } else if (activeFilter === 'archived') {
      result = result.filter((m) => m.archived)
    } else if (activeFilter !== 'all') {
      result = result.filter((m) => m.type === activeFilter && !m.archived)
    } else {
      result = result.filter((m) => !m.archived)
    }

    // Apply debounced text search
    const q = debouncedQuery.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.source.toLowerCase().includes(q)
      )
    }

    // Newest first
    return [...result].sort((a, b) => b.createdAt - a.createdAt)
  }, [memories, activeFilter, debouncedQuery])

  const groupedMemories = useMemo(
    () => groupByDate(filteredMemories),
    [filteredMemories]
  )

  const isFiltering = debouncedQuery.trim().length > 0 || activeFilter !== 'all'

  return { filteredMemories, groupedMemories, isFiltering }
}
