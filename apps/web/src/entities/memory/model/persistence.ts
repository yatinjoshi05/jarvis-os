// ─────────────────────────────────────────────
// JARVIS OS — Memory Persistence
// localStorage adapter with schema versioning
// ─────────────────────────────────────────────

import { MemoryEntry } from './types'

const STORAGE_KEY = 'jarvis_memories_v1'
const SCHEMA_VERSION = 1

interface StoragePayload {
  version: number
  entries: MemoryEntry[]
  lastSync: number
}

/**
 * Persist all memory entries to localStorage.
 * Called optimistically on every store mutation.
 */
export function saveToStorage(entries: MemoryEntry[]): void {
  try {
    const payload: StoragePayload = {
      version: SCHEMA_VERSION,
      entries,
      lastSync: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('[MemoryPersistence] Save failed:', e)
  }
}

/**
 * Hydrate memory entries from localStorage.
 * Returns null on first run or if storage is corrupted.
 */
export function loadFromStorage(): MemoryEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const payload = JSON.parse(raw) as StoragePayload

    // Schema migration point — extend as versions increment
    if (payload.version !== SCHEMA_VERSION) {
      console.warn('[MemoryPersistence] Schema mismatch — resetting to seeds')
      clearStorage()
      return null
    }

    if (!Array.isArray(payload.entries)) return null
    return payload.entries
  } catch (e) {
    console.warn('[MemoryPersistence] Load failed (corrupted storage):', e)
    clearStorage()
    return null
  }
}

/**
 * Read the last sync timestamp without loading all entries.
 */
export function getLastSync(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const payload = JSON.parse(raw) as StoragePayload
    return payload.lastSync ?? 0
  } catch {
    return 0
  }
}

/**
 * Wipe all persisted memory data.
 */
export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
