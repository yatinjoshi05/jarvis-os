// ─────────────────────────────────────────────
// JARVIS OS — Memory Utils
// Frozen-design token mapping + formatters
// ─────────────────────────────────────────────

import { BadgeTone, MemoryType } from './types'

/** Map each MemoryType to the frozen design's Tailwind colour tokens */
export function getTypeTone(type: MemoryType): BadgeTone {
  const tones: Record<MemoryType, BadgeTone> = {
    mission: {
      bg: 'bg-pink-500/20 border-pink-500/30',
      text: 'text-pink-300',
      dot: 'bg-pink-400',
      nodeRing:
        'border-pink-500/60 bg-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.5)]',
      label: 'Mission',
      dotColor: 'bg-pink-500',
      arcColor: 'text-pink-500',
    },
    knowledge: {
      bg: 'bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      nodeRing:
        'border-blue-500/60 bg-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      label: 'Knowledge',
      dotColor: 'bg-purple-500',
      arcColor: 'text-purple-500',
    },
    conversation: {
      bg: 'bg-purple-500/20 border-purple-500/30',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      nodeRing:
        'border-purple-500/60 bg-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
      label: 'Chat',
      dotColor: 'bg-blue-400',
      arcColor: 'text-blue-400',
    },
    file: {
      bg: 'bg-emerald-500/20 border-emerald-500/30',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      nodeRing:
        'border-emerald-500/60 bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      label: 'File',
      dotColor: 'bg-emerald-400',
      arcColor: 'text-emerald-400',
    },
    preference: {
      bg: 'bg-amber-500/20 border-amber-500/30',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      nodeRing:
        'border-amber-500/60 bg-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      label: 'Preference',
      dotColor: 'bg-amber-400',
      arcColor: 'text-amber-400',
    },
    project: {
      bg: 'bg-cyan-500/20 border-cyan-500/30',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
      nodeRing:
        'border-cyan-500/60 bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
      label: 'Project',
      dotColor: 'bg-cyan-400',
      arcColor: 'text-cyan-400',
    },
    manual: {
      bg: 'bg-slate-500/20 border-slate-500/30',
      text: 'text-slate-300',
      dot: 'bg-slate-400',
      nodeRing:
        'border-slate-500/60 bg-slate-500/20 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
      label: 'Note',
      dotColor: 'bg-slate-400',
      arcColor: 'text-slate-400',
    },
  }
  return tones[type]
}

/** Format a unix-ms timestamp into the two-line display used in the timeline */
export function formatTimestamp(ms: number): { line1: string; line2: string } {
  const now = Date.now()
  const diff = now - ms
  const dayMs = 86_400_000
  const date = new Date(ms)

  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diff < dayMs) return { line1: timeStr, line2: 'Today' }
  if (diff < 2 * dayMs) return { line1: 'Yesterday', line2: dateStr }
  if (diff < 7 * dayMs)
    return { line1: `${Math.floor(diff / dayMs)} days ago`, line2: dateStr }
  return { line1: timeStr, line2: dateStr }
}

/** Short date string for the inspector metadata rows */
export function formatFullDate(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Generate a unique memory ID */
export function generateMemoryId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
