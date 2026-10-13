// ─────────────────────────────────────────────
// JARVIS OS — Memory Module — Canonical Types
// Phase 2.1 — Production-ready schema
// ─────────────────────────────────────────────

/** Seven distinct memory categories */
export type MemoryType =
  | 'conversation'
  | 'mission'
  | 'knowledge'
  | 'file'
  | 'project'
  | 'preference'
  | 'manual'

/** Filter extends MemoryType with meta-filters */
export type MemoryFilter = MemoryType | 'all' | 'pinned' | 'archived'

/** Who authored this memory */
export type MemoryAuthor = 'user' | 'jarvis' | 'system'

/** Rich metadata for AI future-proofing */
export interface MemoryMeta {
  projectId?: string
  missionId?: string
  conversationId?: string
  fileId?: string
  filePath?: string
  url?: string
  /** 1–10 importance rating */
  importance: number
  /** 0–1 confidence score */
  confidence: number
  custom?: Record<string, unknown>
}

/** The canonical memory entry — single source of truth */
export interface MemoryEntry {
  id: string
  title: string
  summary: string
  content: string
  type: MemoryType
  tags: string[]
  pinned: boolean
  archived: boolean
  favourite: boolean
  source: string
  relatedMemoryIds: string[]
  metadata: MemoryMeta
  author: MemoryAuthor
  /** Incremented on every update */
  version: number
  createdAt: number   // Unix ms
  updatedAt: number   // Unix ms
  lastAccessed: number // Unix ms
}

/** Derived statistics — computed by useMemoryStats */
export interface MemoryStats {
  total: number
  byType: Record<MemoryType, number>
  pinned: number
  archived: number
  favourites: number
  lastSync: number
  /** Entries created in the past 7 days */
  weeklyDelta: number
  /** Top 9 most-used tags */
  topTags: string[]
}

/** A date-bucketed group of entries for timeline rendering */
export interface MemoryGroup {
  label: 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older'
  entries: MemoryEntry[]
}

/** Position and target for the right-click context menu */
export interface ContextMenuState {
  x: number
  y: number
  memoryId: string
}

/** Frozen design visual tokens for a MemoryType */
export interface BadgeTone {
  bg: string
  text: string
  dot: string
  nodeRing: string
  /** Short human-readable label (badge text) */
  label: string
  /** Dot colour for the donut legend */
  dotColor: string
  /** Tailwind text class for the donut arc */
  arcColor: string
}

/** Zustand store state slice */
export interface MemoryStoreState {
  memories: MemoryEntry[]
  selectedId: string | null
  searchQuery: string
  activeFilter: MemoryFilter
  isLoading: boolean
  error: string | null
  isHydrated: boolean
}

/** Zustand store actions slice */
export interface MemoryStoreActions {
  addMemory: (
    entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'version'>
  ) => string
  updateMemory: (id: string, patch: Partial<Omit<MemoryEntry, 'id' | 'createdAt'>>) => void
  deleteMemory: (id: string) => void
  togglePin: (id: string) => void
  toggleFavourite: (id: string) => void
  toggleArchive: (id: string) => void
  duplicateMemory: (id: string) => void
  setSelected: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setFilter: (filter: MemoryFilter) => void
  importMemories: (entries: MemoryEntry[]) => void
  resetToSeeds: () => void
  hydrate: () => void
}

export type MemoryStore = MemoryStoreState & MemoryStoreActions
