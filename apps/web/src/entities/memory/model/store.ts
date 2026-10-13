// ─────────────────────────────────────────────
// JARVIS OS — Memory Store
// Zustand 5 — full CRUD + selection + search + filter
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { MemoryEntry, MemoryFilter, MemoryStore } from './types'
import { saveToStorage, loadFromStorage } from './persistence'
import { createSeeds } from './seeds'
import { generateMemoryId } from './utils'

export const useMemoryStore = create<MemoryStore>()((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  memories: [],
  selectedId: null,
  searchQuery: '',
  activeFilter: 'all' as MemoryFilter,
  isLoading: false,
  error: null,
  isHydrated: false,

  // ── Hydration ────────────────────────────────────────────────────────────
  hydrate: () => {
    if (get().isHydrated) return
    const stored = loadFromStorage()
    const memories = stored ?? createSeeds()
    set({ memories, isHydrated: true })
    // If no stored data, persist the seeds immediately
    if (!stored) saveToStorage(memories)
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────
  addMemory: (entry) => {
    const id = generateMemoryId()
    const now = Date.now()
    const newEntry: MemoryEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      version: 1,
    }
    const memories = [newEntry, ...get().memories]
    set({ memories })
    saveToStorage(memories)
    return id
  },

  updateMemory: (id, patch) => {
    const memories = get().memories.map((m) => {
      if (m.id !== id) return m
      return {
        ...m,
        ...patch,
        updatedAt: Date.now(),
        version: m.version + 1,
      }
    })
    set({ memories })
    saveToStorage(memories)
  },

  deleteMemory: (id) => {
    const memories = get().memories.filter((m) => m.id !== id)
    const selectedId = get().selectedId === id ? null : get().selectedId
    set({ memories, selectedId })
    saveToStorage(memories)
  },

  // ── Toggles ───────────────────────────────────────────────────────────────
  togglePin: (id) => {
    const memories = get().memories.map((m) =>
      m.id === id
        ? { ...m, pinned: !m.pinned, updatedAt: Date.now(), version: m.version + 1 }
        : m
    )
    set({ memories })
    saveToStorage(memories)
  },

  toggleFavourite: (id) => {
    const memories = get().memories.map((m) =>
      m.id === id
        ? { ...m, favourite: !m.favourite, updatedAt: Date.now(), version: m.version + 1 }
        : m
    )
    set({ memories })
    saveToStorage(memories)
  },

  toggleArchive: (id) => {
    const memories = get().memories.map((m) =>
      m.id === id
        ? { ...m, archived: !m.archived, updatedAt: Date.now(), version: m.version + 1 }
        : m
    )
    // Deselect if the selected entry gets archived and we're not in archived view
    const activeFilter = get().activeFilter
    const isArchivingSelected = get().selectedId === id
    const leavingView = activeFilter !== 'archived' && isArchivingSelected
    set({
      memories,
      selectedId: leavingView ? null : get().selectedId,
    })
    saveToStorage(memories)
  },

  duplicateMemory: (id) => {
    const source = get().memories.find((m) => m.id === id)
    if (!source) return
    const now = Date.now()
    const duplicate: MemoryEntry = {
      ...source,
      id: generateMemoryId(),
      title: `${source.title} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      version: 1,
      pinned: false,
      favourite: false,
    }
    const memories = [duplicate, ...get().memories]
    set({ memories })
    saveToStorage(memories)
  },

  // ── Selection ─────────────────────────────────────────────────────────────
  setSelected: (id) => {
    if (id === get().selectedId) {
      set({ selectedId: null })
      return
    }
    // Update lastAccessed on selection
    if (id) {
      const memories = get().memories.map((m) =>
        m.id === id ? { ...m, lastAccessed: Date.now() } : m
      )
      set({ memories, selectedId: id })
      saveToStorage(memories)
    } else {
      set({ selectedId: null })
    }
  },

  // ── Search & Filter ───────────────────────────────────────────────────────
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilter: (filter) => set({ activeFilter: filter }),

  // ── Import / Export ───────────────────────────────────────────────────────
  importMemories: (entries) => {
    // Deduplicate by id — incoming entries win
    const existing = get().memories.filter(
      (m) => !entries.some((e) => e.id === m.id)
    )
    const memories = [...entries, ...existing]
    set({ memories })
    saveToStorage(memories)
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetToSeeds: () => {
    const memories = createSeeds()
    set({ memories, selectedId: null, searchQuery: '', activeFilter: 'all' })
    saveToStorage(memories)
  },
}))

/** Convenience selector — returns the currently selected MemoryEntry or null */
export const selectSelectedMemory = (store: MemoryStore): MemoryEntry | null =>
  store.memories.find((m) => m.id === store.selectedId) ?? null
