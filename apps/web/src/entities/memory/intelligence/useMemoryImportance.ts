// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — useMemoryImportance
// Phase 2.2 — Importance score hook (instant client-side + async backend)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { MemoryEntry } from '../model/types'
import type { ScoredImportance } from './types'
import { computeImportance } from './MemoryImportanceEngine'
import { getImportance } from './MemoryIntelligenceAPI'

/**
 * Returns an importance score for a memory entry.
 * - Instantly returns client-side computed score
 * - Upgrades to backend score when available
 */
export function useMemoryImportance(entry: MemoryEntry | null): ScoredImportance | null {
  const [score, setScore] = useState<ScoredImportance | null>(null)

  // Instant client-side score
  useEffect(() => {
    if (!entry) { setScore(null); return }
    setScore(computeImportance(entry))
  }, [entry?.id, entry?.updatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  // Upgrade with backend score (non-blocking)
  useEffect(() => {
    if (!entry) return
    let cancelled = false
    getImportance(entry.id)
      .then(result => { if (!cancelled) setScore(result) })
      .catch(() => { /* keep client-side score */ })
    return () => { cancelled = true }
  }, [entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return score
}
