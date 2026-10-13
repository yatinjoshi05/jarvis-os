// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryImportanceEngine (client-side)
// Phase 2.2 — Local importance scoring for instant UI display
// Mirrors the backend formula for zero-latency rendering.
// ─────────────────────────────────────────────────────────────────────────────

import type { MemoryEntry } from '../model/types'
import type { ImportanceFactors, ScoredImportance } from './types'

const WEIGHTS: Record<keyof ImportanceFactors, number> = {
  accessFrequency:     0.20,
  recency:             0.20,
  pinWeight:           0.15,
  relationshipDensity: 0.15,
  aiConfidence:        0.15,
  tagRichness:         0.10,
}

/**
 * Compute a 1–10 importance score for a memory entry using only client-side data.
 * Suitable for instant display before the backend responds.
 */
export function computeImportance(entry: MemoryEntry): ScoredImportance {
  const now = Date.now()
  const ageMs = now - (entry.updatedAt ?? entry.createdAt ?? now)

  const factors: ImportanceFactors = {
    accessFrequency: Math.min(1, Math.log((entry as any).accessCount ?? 0 + 1) / Math.log(50)),
    recency: Math.exp(-ageMs / (30 * 86_400_000)),
    pinWeight: entry.pinned ? 1 : 0,
    relationshipDensity: Math.min(1, (entry.relatedMemoryIds?.length ?? 0) / 10),
    aiConfidence: entry.metadata.confidence ?? 0.5,
    tagRichness: Math.min(1, (entry.tags?.length ?? 0) / 5),
  }

  let raw = 0
  for (const [factor, weight] of Object.entries(WEIGHTS) as [keyof ImportanceFactors, number][]) {
    raw += (factors[factor] ?? 0) * weight
  }

  // Also factor in the stored importance (1-10 scale)
  const baseImportance = (entry.metadata.importance ?? 5) / 10
  raw = raw * 0.95 + baseImportance * 0.05

  const score = Math.max(1, Math.min(10, Math.round(raw * 10)))
  return { score, factors }
}

/**
 * Map an importance score (1–10) to a Tailwind colour class.
 */
export function importanceToColor(score: number): string {
  if (score >= 9) return 'bg-red-500'
  if (score >= 7) return 'bg-orange-500'
  if (score >= 5) return 'bg-amber-400'
  if (score >= 3) return 'bg-blue-400'
  return 'bg-slate-500'
}

/**
 * Map an importance score to a text label.
 */
export function importanceToLabel(score: number): string {
  if (score >= 9) return 'Critical'
  if (score >= 7) return 'High'
  if (score >= 5) return 'Medium'
  if (score >= 3) return 'Low'
  return 'Minimal'
}
