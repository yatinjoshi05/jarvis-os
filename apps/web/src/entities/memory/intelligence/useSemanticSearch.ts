// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — useSemanticSearch
// Phase 2.2 — Semantic search hook with keyword fallback
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMemoryStore } from '../model/store'
import type { MemoryEntry } from '../model/types'
import type { SemanticSearchResult } from './types'
import { semanticSearch } from './MemoryIntelligenceAPI'

const SEMANTIC_MIN_CHARS = 3   // Minimum query length to use semantic search
const DEBOUNCE_MS = 350        // Slightly longer than keyword debounce

export interface UseSemanticSearchResult {
  results: MemoryEntry[]
  semanticResults: SemanticSearchResult[]
  isSemantic: boolean   // true when backend semantic search was used
  isLoading: boolean
  explanations: Map<string, string>  // memoryId → explanation string
}

/**
 * Semantic search hook.
 * - Uses backend vector search when query length ≥ SEMANTIC_MIN_CHARS
 * - Falls back to client-side keyword filtering when backend is unavailable
 * - Returns both plain MemoryEntry[] (for existing UI) and full SemanticSearchResult[]
 */
export function useSemanticSearch(query: string): UseSemanticSearchResult {
  const memories = useMemoryStore(s => s.memories)
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([])
  const [isSemantic, setIsSemantic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runSemanticSearch = useCallback(async (q: string) => {
    if (q.length < SEMANTIC_MIN_CHARS) {
      setSemanticResults([])
      setIsSemantic(false)
      return
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    try {
      const hits = await semanticSearch(q, { limit: 20, threshold: 0.05 })
      // Filter out archived
      const filtered = hits.filter(r => !r.entry?.archived)
      setSemanticResults(filtered)
      setIsSemantic(filtered.length > 0)
    } catch {
      // Backend unavailable — fallback handled by caller
      setSemanticResults([])
      setIsSemantic(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query || query.length < SEMANTIC_MIN_CHARS) {
      setSemanticResults([])
      setIsSemantic(false)
      setIsLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => runSemanticSearch(query), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSemanticSearch])

  // Build explanations map
  const explanations = new Map<string, string>()
  for (const r of semanticResults) {
    if (r.entry?.id && r.explanation) {
      explanations.set(r.entry.id, r.explanation)
    }
  }

  // Merge: semantic results first, then remaining keyword hits
  let results: MemoryEntry[]
  if (isSemantic && semanticResults.length > 0) {
    const semanticIds = new Set(semanticResults.map(r => r.entry?.id))
    const localFallback = memories.filter(m =>
      !m.archived &&
      !semanticIds.has(m.id) &&
      query.split(' ').some(word =>
        m.title.toLowerCase().includes(word.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(word.toLowerCase()))
      )
    )
    results = [
      ...semanticResults.map(r => r.entry).filter(Boolean) as MemoryEntry[],
      ...localFallback,
    ]
  } else {
    results = []
  }

  return { results, semanticResults, isSemantic, isLoading, explanations }
}
