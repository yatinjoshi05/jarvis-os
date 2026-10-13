// ─────────────────────────────────────────────
// JARVIS OS — Memory Intelligence — Types
// Phase 2.2 — AI Memory layer type definitions
// ─────────────────────────────────────────────

import { MemoryEntry, MemoryType } from '../model/types'

// ── Embeddings ────────────────────────────────────────────────────────────────

export interface MemoryEmbedding {
  memoryId: string
  vector: number[]
  model: string
  generatedAt: number
}

// ── Semantic Search ───────────────────────────────────────────────────────────

export interface SemanticSearchResult {
  entry: MemoryEntry
  /** Raw cosine similarity from the vector store (0–1) */
  semanticScore: number
  /** Blended final score: 0.7 * semantic + 0.3 * keyword */
  totalScore: number
  /** Human-readable explanation of why this was retrieved */
  explanation: string
}

// ── Relationships ─────────────────────────────────────────────────────────────

export type RelationshipType =
  | 'shares-tag'
  | 'same-project'
  | 'same-conversation'
  | 'semantic-similarity'
  | 'temporal-proximity'
  | 'type-affinity'
  | 'manually-linked'

export interface MemoryRelationship {
  fromId: string
  toId: string
  type: RelationshipType
  /** 0–1 confidence in this relationship */
  confidence: number
  reason: string
}

export interface RelatedMemory {
  entry: MemoryEntry
  relationship: MemoryRelationship
}

// ── Knowledge Graph ───────────────────────────────────────────────────────────

export type NodeType = MemoryType | 'person' | 'project' | 'technology' | 'concept'

export interface KnowledgeNode {
  id: string
  label: string
  type: NodeType
  /** IDs of directly connected nodes */
  connections: string[]
  weight: number
}

export interface GraphEdge {
  from: string
  to: string
  type: RelationshipType
  weight: number
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>
  edges: GraphEdge[]
}

// ── AI Summaries ──────────────────────────────────────────────────────────────

export interface AISummary {
  memoryId: string
  short: string
  detailed: string
  keyPoints: string[]
  entities: string[]
  technologies: string[]
  generatedAt: number
}

// ── Insights ──────────────────────────────────────────────────────────────────

export type InsightCategory =
  | 'frequency'
  | 'streak'
  | 'stale'
  | 'cross-reference'
  | 'growth'
  | 'activity'
  | 'recommendation'

export interface MemoryInsight {
  id: string
  text: string
  category: InsightCategory
  /** 0–1 confidence / relevance */
  confidence: number
  relatedIds: string[]
  generatedAt: number
  /** Lucide-compatible icon name hint */
  icon: string
}

// ── Importance ────────────────────────────────────────────────────────────────

export interface ImportanceFactors {
  /** Logarithmic access count score 0–1 */
  accessFrequency: number
  /** Exponential recency decay 0–1 */
  recency: number
  /** Flat bonus for pinned entries */
  pinWeight: number
  /** Number of relationships / 10, capped at 1 */
  relationshipDensity: number
  /** From metadata.confidence 0–1 */
  aiConfidence: number
  /** tags.length / 5, capped at 1 */
  tagRichness: number
}

export interface ScoredImportance {
  score: number   // 1–10 final importance
  factors: ImportanceFactors
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export type MemoryLifecycleStage =
  | 'working'    // accessed in last hour
  | 'short-term' // created in last 7 days
  | 'long-term'  // importance ≥ 7, older than 7 days
  | 'archived'   // explicitly archived
  | 'forgotten'  // never accessed, low importance, old

export interface LifecycleStatus {
  stage: MemoryLifecycleStage
  promotedAt?: number
  demotedAt?: number
  reason?: string
}

// ── Context Injection ─────────────────────────────────────────────────────────

export interface ContextMemorySnippet {
  memoryId: string
  title: string
  type: MemoryType
  summary: string
  relevanceScore: number
  recallReason: string
}

export interface InjectedContext {
  snippets: ContextMemorySnippet[]
  tokenEstimate: number
  contextString: string
}
