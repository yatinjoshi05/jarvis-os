// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Memory Intelligence API
// Phase 2.2 — Typed fetch wrappers for all intelligence endpoints
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SemanticSearchResult,
  RelatedMemory,
  AISummary,
  MemoryInsight,
  ScoredImportance,
  InjectedContext,
} from './types'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:3001'
const BASE = `${BACKEND_URL}/api/memory`
const TIMEOUT_MS = 8000

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error ?? 'Unknown error')
    return json.data as T
  } finally {
    clearTimeout(timeout)
  }
}

// ── Semantic Search ───────────────────────────────────────────────────────────

export interface SemanticSearchOptions {
  limit?: number
  threshold?: number
  category?: string
}

export async function semanticSearch(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const params = new URLSearchParams({ q: query })
  if (options.limit) params.set('limit', String(options.limit))
  if (options.threshold) params.set('threshold', String(options.threshold))
  if (options.category) params.set('category', options.category)
  return apiFetch<SemanticSearchResult[]>(`/search/semantic?${params}`)
}

// ── Context Injection ─────────────────────────────────────────────────────────

export async function getMemoryContext(
  query: string,
  limit = 5
): Promise<InjectedContext> {
  return apiFetch<InjectedContext>('/context', {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  })
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export async function getInsights(): Promise<MemoryInsight[]> {
  return apiFetch<MemoryInsight[]>('/insights')
}

// ── Related Memories ──────────────────────────────────────────────────────────

export async function getRelatedMemories(
  memoryId: string,
  limit = 5
): Promise<RelatedMemory[]> {
  return apiFetch<RelatedMemory[]>(`/${memoryId}/related?limit=${limit}`)
}

// ── AI Summary ────────────────────────────────────────────────────────────────

export async function generateSummary(memoryId: string): Promise<AISummary> {
  return apiFetch<AISummary>(`/${memoryId}/summarise`, { method: 'POST', body: '{}' })
}

// ── Importance Score ──────────────────────────────────────────────────────────

export async function getImportance(memoryId: string): Promise<ScoredImportance> {
  return apiFetch<ScoredImportance>(`/${memoryId}/importance`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export interface LifecycleStageResult {
  stage: 'working' | 'short-term' | 'long-term' | 'archived' | 'forgotten' | 'unknown'
}

export async function getLifecycleStage(memoryId: string): Promise<LifecycleStageResult> {
  return apiFetch<LifecycleStageResult>(`/${memoryId}/lifecycle`)
}

export async function getLifecycleSummary(): Promise<Record<string, number>> {
  return apiFetch<Record<string, number>>('/lifecycle/summary')
}

export async function promoteMemory(memoryId: string): Promise<{ stage: string; importance: number }> {
  return apiFetch(`/${memoryId}/promote`, { method: 'POST', body: '{}' })
}

export async function demoteMemory(memoryId: string): Promise<{ stage: string; importance: number }> {
  return apiFetch(`/${memoryId}/demote`, { method: 'POST', body: '{}' })
}

// ── Knowledge Graph ───────────────────────────────────────────────────────────

export interface GraphNeighbour {
  node: { id: string; label: string; type: string; connections: string[]; weight: number }
  distance: number
}

export async function getGraphNeighbours(
  nodeId: string,
  depth = 2
): Promise<GraphNeighbour[]> {
  return apiFetch<GraphNeighbour[]>(`/graph/neighbours/${nodeId}?depth=${depth}`)
}

export async function getGraphStats(): Promise<Record<string, unknown>> {
  return apiFetch('/graph/stats')
}

// ── Health check ──────────────────────────────────────────────────────────────

/** Returns true if the intelligence backend is reachable */
export async function isIntelligenceAvailable(): Promise<boolean> {
  try {
    await apiFetch('/insights')
    return true
  } catch {
    return false
  }
}
