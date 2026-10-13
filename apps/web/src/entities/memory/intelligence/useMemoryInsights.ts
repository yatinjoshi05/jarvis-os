// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — useMemoryInsights
// Phase 2.2 — AI-generated insight polling hook
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMemoryStore } from '../model/store'
import type { MemoryInsight } from './types'
import { getInsights } from './MemoryIntelligenceAPI'

const POLL_INTERVAL_MS = 5 * 60 * 1000   // 5 minutes
const INITIAL_DELAY_MS = 2000             // Wait 2s before first fetch (let backend settle)

export interface UseMemoryInsightsResult {
  insights: MemoryInsight[]
  isLoading: boolean
  refresh: () => void
  dismiss: (id: string) => void
}

/**
 * Fetches and polls AI-generated memory insights.
 * - Initial fetch after 2s delay
 * - Re-fetches every 5 minutes
 * - Re-fetches when total memory count changes
 * - Supports manual dismiss (local only — insights regenerate on next poll)
 */
export function useMemoryInsights(): UseMemoryInsightsResult {
  const memoryCount = useMemoryStore(s => s.memories.filter(m => !m.archived).length)
  const [insights, setInsights] = useState<MemoryInsight[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevCountRef = useRef(memoryCount)

  const fetchInsights = useCallback(async () => {
    setIsLoading(true)
    try {
      const results = await getInsights()
      setInsights(results)
    } catch {
      // Backend unavailable — keep showing existing insights
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch with small delay
  useEffect(() => {
    const t = setTimeout(fetchInsights, INITIAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [fetchInsights])

  // Poll every 5 minutes
  useEffect(() => {
    timerRef.current = setInterval(fetchInsights, POLL_INTERVAL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchInsights])

  // Re-fetch when memory count changes (new memories created)
  useEffect(() => {
    if (prevCountRef.current !== memoryCount && memoryCount > 0) {
      prevCountRef.current = memoryCount
      const t = setTimeout(fetchInsights, 1000) // slight delay
      return () => clearTimeout(t)
    }
  }, [memoryCount, fetchInsights])

  const refresh = useCallback(() => {
    setDismissed(new Set()) // Clear dismissals on manual refresh
    fetchInsights()
  }, [fetchInsights])

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }, [])

  const visibleInsights = insights.filter(i => !dismissed.has(i.id))

  return { insights: visibleInsights, isLoading, refresh, dismiss }
}
