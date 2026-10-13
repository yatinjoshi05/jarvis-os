// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — useRelatedMemories
// Phase 2.2 — Related memory discovery hook
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { RelatedMemory } from './types'
import { getRelatedMemories } from './MemoryIntelligenceAPI'

export interface UseRelatedMemoriesResult {
  related: RelatedMemory[]
  isLoading: boolean
  error: string | null
}

/**
 * Fetches related memories for a given memory id.
 * Re-fetches when the memoryId changes.
 * Returns empty array when backend is unavailable.
 */
export function useRelatedMemories(memoryId: string | null, limit = 4): UseRelatedMemoriesResult {
  const [related, setRelated] = useState<RelatedMemory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!memoryId) {
      setRelated([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getRelatedMemories(memoryId, limit)
      .then(results => {
        if (!cancelled) setRelated(results)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message)
          setRelated([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [memoryId, limit])

  return { related, isLoading, error }
}
