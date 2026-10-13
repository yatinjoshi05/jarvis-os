// ─────────────────────────────────────────────
// JARVIS OS — Memory Import / Export Service
// JSON, Markdown — future-ready for PDF
// ─────────────────────────────────────────────

import { MemoryEntry } from '../model/types'
import { getTypeTone, formatFullDate } from '../model/utils'

// ── Export ──────────────────────────────────────────────────────────────────

/** Download all memories as a prettified JSON file */
export function exportToJSON(memories: MemoryEntry[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    count: memories.length,
    entries: memories,
  }
  downloadFile(
    'jarvis-memory-export.json',
    JSON.stringify(payload, null, 2),
    'application/json'
  )
}

/** Export a single memory entry as JSON */
export function exportEntryToJSON(entry: MemoryEntry): void {
  downloadFile(
    `jarvis-memory-${entry.id}.json`,
    JSON.stringify(entry, null, 2),
    'application/json'
  )
}

/** Download all memories as a human-readable Markdown file */
export function exportToMarkdown(memories: MemoryEntry[]): void {
  const lines: string[] = [
    '# JARVIS Memory Export',
    '',
    `**Exported:** ${new Date().toLocaleString()}`,
    `**Total entries:** ${memories.length}`,
    '',
    '---',
    '',
  ]

  for (const entry of memories) {
    const tone = getTypeTone(entry.type)
    lines.push(`## ${entry.title}`)
    lines.push('')
    lines.push(`**Type:** ${tone.label}  `)
    lines.push(`**Source:** ${entry.source}  `)
    lines.push(`**Created:** ${formatFullDate(entry.createdAt)}  `)
    lines.push(`**Tags:** ${entry.tags.join(', ') || '—'}  `)
    if (entry.pinned) lines.push('📌 _Pinned_  ')
    if (entry.favourite) lines.push('⭐ _Favourite_  ')
    lines.push('')
    lines.push(`> ${entry.summary}`)
    lines.push('')
    if (entry.content && entry.content !== entry.summary) {
      lines.push(entry.content)
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  }

  downloadFile('jarvis-memory-export.md', lines.join('\n'), 'text/markdown')
}

// ── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  entries: MemoryEntry[]
  errors: string[]
}

/**
 * Parse a JSON file (either a full export payload or a raw MemoryEntry[])
 * and return validated entries.
 */
export function parseJSONImport(raw: string): ImportResult {
  const errors: string[] = []
  const entries: MemoryEntry[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { entries: [], errors: ['Invalid JSON — file cannot be parsed.'] }
  }

  // Accept both { entries: [...] } payload format and plain array format
  let candidates: unknown[]
  if (Array.isArray(parsed)) {
    candidates = parsed
  } else if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'entries' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).entries)
  ) {
    candidates = (parsed as Record<string, unknown>).entries as unknown[]
  } else {
    return { entries: [], errors: ['Unrecognised format — expected an array or export payload.'] }
  }

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const result = validateEntry(candidate, i)
    if (result.valid && result.entry) {
      entries.push(result.entry)
    } else {
      errors.push(result.error ?? `Entry ${i}: unknown validation error`)
    }
  }

  return { entries, errors }
}

/** Trigger the file picker and return the parsed result */
export function importFromJSONFile(): Promise<ImportResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve({ entries: [], errors: ['No file selected.'] })
        return
      }
      try {
        const text = await file.text()
        resolve(parseJSONImport(text))
      } catch {
        resolve({ entries: [], errors: ['Failed to read file.'] })
      }
    }
    input.click()
  })
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface ValidationResult {
  valid: boolean
  entry?: MemoryEntry
  error?: string
}

function validateEntry(raw: unknown, index: number): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: `Entry ${index}: not an object` }
  }

  const e = raw as Record<string, unknown>

  if (typeof e.id !== 'string' || !e.id) {
    return { valid: false, error: `Entry ${index}: missing 'id'` }
  }
  if (typeof e.title !== 'string' || !e.title) {
    return { valid: false, error: `Entry ${index}: missing 'title'` }
  }
  if (typeof e.summary !== 'string') {
    return { valid: false, error: `Entry ${index}: missing 'summary'` }
  }

  const VALID_TYPES = [
    'conversation', 'mission', 'knowledge', 'file', 'project', 'preference', 'manual',
  ]
  if (!VALID_TYPES.includes(e.type as string)) {
    return { valid: false, error: `Entry ${index}: invalid 'type' "${e.type}"` }
  }

  // Coerce optional fields with safe defaults
  const now = Date.now()
  const entry: MemoryEntry = {
    id: e.id as string,
    title: e.title as string,
    summary: e.summary as string,
    content: typeof e.content === 'string' ? e.content : (e.summary as string),
    type: e.type as MemoryEntry['type'],
    tags: Array.isArray(e.tags) ? (e.tags as string[]).filter((t) => typeof t === 'string') : [],
    pinned: Boolean(e.pinned),
    archived: Boolean(e.archived),
    favourite: Boolean(e.favourite),
    source: typeof e.source === 'string' ? e.source : 'import',
    relatedMemoryIds: Array.isArray(e.relatedMemoryIds) ? (e.relatedMemoryIds as string[]) : [],
    metadata: {
      importance: typeof (e.metadata as Record<string, unknown>)?.importance === 'number'
        ? (e.metadata as Record<string, unknown>).importance as number
        : 5,
      confidence: typeof (e.metadata as Record<string, unknown>)?.confidence === 'number'
        ? (e.metadata as Record<string, unknown>).confidence as number
        : 1.0,
    },
    author: typeof e.author === 'string' ? (e.author as MemoryEntry['author']) : 'user',
    version: typeof e.version === 'number' ? e.version : 1,
    createdAt: typeof e.createdAt === 'number' ? e.createdAt : now,
    updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : now,
    lastAccessed: typeof e.lastAccessed === 'number' ? e.lastAccessed : now,
  }

  return { valid: true, entry }
}
