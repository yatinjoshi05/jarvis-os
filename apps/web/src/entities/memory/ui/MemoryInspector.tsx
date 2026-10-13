// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryInspector (Phase 2.2)
// Right-panel detail + inline edit + AI intelligence panels
// Visual design: FROZEN — layout / spacing / typography unchanged
// New intelligence panels are additive sections within the existing scroll area
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
  X,
  Pin,
  Star,
  Archive,
  Trash2,
  Download,
  SquarePen,
  Check,
  Tag,
  Clock,
  RotateCcw,
  Sparkles,
  Link2,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useMemoryStore, selectSelectedMemory } from '../model/store'
import { getTypeTone, formatFullDate } from '../model/utils'
import { exportEntryToJSON } from '../services/memoryImportExport'
import { useRelatedMemories } from '../intelligence/useRelatedMemories'
import { useMemoryImportance } from '../intelligence/useMemoryImportance'
import { importanceToColor, importanceToLabel } from '../intelligence/MemoryImportanceEngine'
import { generateSummary } from '../intelligence/MemoryIntelligenceAPI'
import type { AISummary } from '../intelligence/types'

export function MemoryInspector() {
  const store = useMemoryStore()
  const entry = selectSelectedMemory(store)
  const { updateMemory, deleteMemory, togglePin, toggleFavourite, toggleArchive, setSelected } = store

  // ── Local edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])

  // ── Intelligence state ────────────────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [isSummarising, setIsSummarising] = useState(false)
  const [showRelated, setShowRelated] = useState(true)
  const [showKeyPoints, setShowKeyPoints] = useState(false)

  const { related, isLoading: relatedLoading } = useRelatedMemories(entry?.id ?? null, 3)
  const importance = useMemoryImportance(entry)

  // Sync local edit state when selected entry changes
  useEffect(() => {
    if (entry) {
      setEditTitle(entry.title)
      setEditSummary(entry.summary)
      setEditContent(entry.content)
      setEditTags(entry.tags)
      setIsEditing(false)
      setAiSummary(null)
    }
  }, [entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!entry) return null

  const tone = getTypeTone(entry.type)

  // Lifecycle stage label
  const lifecycleStage = (() => {
    const now = Date.now()
    const lastAccessed = entry.lastAccessed ?? entry.updatedAt ?? now
    const ageMs = now - (entry.createdAt ?? now)
    if (now - lastAccessed < 3_600_000) return { label: 'Working', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    if (ageMs < 7 * 86_400_000) return { label: 'Short-term', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
    if ((entry.metadata.importance ?? 5) >= 7) return { label: 'Long-term', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
    return { label: 'Long-term', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
  })()

  const handleSave = () => {
    if (!editTitle.trim()) return
    updateMemory(entry.id, {
      title: editTitle.trim(),
      summary: editSummary.trim(),
      content: editContent.trim(),
      tags: editTags,
    })
    setIsEditing(false)
  }

  const handleDelete = () => { deleteMemory(entry.id) }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && editTagInput.trim()) {
      e.preventDefault()
      const tag = editTagInput.trim().replace(/,/g, '')
      if (!editTags.includes(tag)) setEditTags([...editTags, tag])
      setEditTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => { setEditTags(editTags.filter(t => t !== tag)) }

  const handleGenerateSummary = async () => {
    if (!entry) return
    setIsSummarising(true)
    try {
      const summary = await generateSummary(entry.id)
      setAiSummary(summary)
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsSummarising(false)
    }
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar">

      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
        {/* Top row: badge + lifecycle + flags + close */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-medium ${tone.bg} ${tone.text}`}>
              {tone.label}
            </span>
            {/* Lifecycle badge */}
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-medium ${lifecycleStage.color}`}>
              {lifecycleStage.label}
            </span>
            {entry.pinned && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] text-amber-400">
                <Pin size={8} /> Pinned
              </span>
            )}
            {entry.favourite && (
              <span className="flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 text-[9px] text-pink-400">
                <Star size={8} /> Favourite
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close inspector"
            onClick={() => setSelected(null)}
            className="text-white/30 transition-colors hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Importance bar */}
        {importance && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-medium uppercase tracking-wider text-white/25">Importance</span>
              <span className="text-[9px] font-bold text-white/50">{importanceToLabel(importance.score)} · {importance.score}/10</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${importanceToColor(importance.score)}`}
                style={{ width: `${importance.score * 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Title */}
        {isEditing ? (
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-white border-b border-pink-500/50 pb-1 focus:outline-none placeholder-white/30"
            placeholder="Memory title"
          />
        ) : (
          <h3 className="text-sm font-bold tracking-tight text-white leading-snug">{entry.title}</h3>
        )}

        {/* Summary */}
        {isEditing ? (
          <textarea
            rows={2}
            value={editSummary}
            onChange={e => setEditSummary(e.target.value)}
            className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/80 placeholder-white/30 focus:border-pink-500/40 focus:outline-none"
            placeholder="Short summary"
          />
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-white/60">{entry.summary}</p>
        )}
      </div>

      {/* ── AI Summary card ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
            <Sparkles size={10} className="text-pink-400" /> AI Summary
          </p>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={isSummarising}
            className="flex items-center gap-1 rounded-lg border border-pink-500/20 bg-pink-500/5 px-2 py-0.5 text-[9px] font-medium text-pink-400 hover:bg-pink-500/15 transition-colors disabled:opacity-40"
          >
            {isSummarising
              ? <><RefreshCw size={8} className="animate-spin" /> Generating</>
              : <><Sparkles size={8} /> {aiSummary ? 'Regenerate' : 'Generate'}</>
            }
          </button>
        </div>

        {aiSummary ? (
          <div className="space-y-2">
            <p className="text-[11px] leading-relaxed text-white/70">{aiSummary.short}</p>
            {aiSummary.keyPoints.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowKeyPoints(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  {showKeyPoints ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  Key points ({aiSummary.keyPoints.length})
                </button>
                {showKeyPoints && (
                  <ul className="mt-1.5 space-y-1">
                    {aiSummary.keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-1.5 text-[10px] text-white/60">
                        <span className="text-pink-400/60 flex-shrink-0">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {aiSummary.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {aiSummary.technologies.slice(0, 5).map(t => (
                  <span key={t} className="rounded-md border border-blue-500/20 bg-blue-500/5 px-1.5 py-0.5 text-[9px] text-blue-400">{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-white/30 italic">Click "Generate" for an AI-powered summary of this memory.</p>
        )}
      </div>

      {/* ── Content card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/25">Content</p>
        {isEditing ? (
          <textarea
            rows={4}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white/80 placeholder-white/30 focus:border-pink-500/40 focus:outline-none"
            placeholder="Full content or notes..."
          />
        ) : (
          <p className="text-xs leading-relaxed text-white/60">{entry.content || entry.summary}</p>
        )}
      </div>

      {/* ── Related Memories card ────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
            <Link2 size={10} /> Related
          </p>
          <button
            type="button"
            onClick={() => setShowRelated(v => !v)}
            className="text-white/20 hover:text-white/50 transition-colors"
          >
            {showRelated ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {showRelated && (
          <div className="space-y-2">
            {relatedLoading && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                <RefreshCw size={9} className="animate-spin" /> Discovering related memories…
              </div>
            )}
            {!relatedLoading && related.length === 0 && (
              <p className="text-[10px] text-white/25 italic">No related memories found yet.</p>
            )}
            {related.map(r => {
              const relatedTone = getTypeTone(r.entry.type)
              return (
                <button
                  key={r.entry.id}
                  type="button"
                  onClick={() => setSelected(r.entry.id)}
                  className="w-full text-left rounded-xl border border-white/5 bg-white/[.02] p-2.5 hover:border-white/10 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-medium ${relatedTone.bg} ${relatedTone.text}`}>
                      {relatedTone.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-white/80 group-hover:text-white truncate">{r.entry.title}</p>
                      <p className="mt-0.5 text-[9px] text-white/35 leading-relaxed line-clamp-1">{r.relationship.reason}</p>
                      <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-pink-500/50"
                          style={{ width: `${Math.round(r.relationship.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Tags card ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
          <Tag size={10} /> Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(isEditing ? editTags : entry.tags).map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
            >
              {tag}
              {isEditing && (
                <button type="button" onClick={() => handleRemoveTag(tag)} className="text-white/30 hover:text-red-400">
                  <X size={9} />
                </button>
              )}
            </span>
          ))}
          {isEditing && (
            <input
              value={editTagInput}
              onChange={e => setEditTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag…"
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 placeholder-white/30 focus:border-pink-500/40 focus:outline-none w-20"
            />
          )}
          {!isEditing && entry.tags.length === 0 && (
            <span className="text-[10px] text-white/25">No tags</span>
          )}
        </div>
      </div>

      {/* ── Metadata card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4 space-y-2">
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
          <Clock size={10} /> Metadata
        </p>
        {[
          { label: 'Source', value: entry.source },
          { label: 'Author', value: entry.author },
          { label: 'Confidence', value: `${Math.round(entry.metadata.confidence * 100)}%` },
          { label: 'Created', value: formatFullDate(entry.createdAt) },
          { label: 'Updated', value: formatFullDate(entry.updatedAt) },
          { label: 'Accessed', value: formatFullDate(entry.lastAccessed) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-2">
            <span className="text-[10px] text-white/30 flex-shrink-0">{label}</span>
            <span className="text-[10px] text-white/60 text-right font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Actions card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-4">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-pink-500/50 bg-pink-500/20 py-2 text-xs font-semibold text-pink-200 transition-colors hover:bg-pink-500/30 hover:text-white"
            >
              <Check size={13} /> Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2 text-xs font-medium text-white/50 transition-colors hover:text-white"
            >
              <RotateCcw size={13} /> Cancel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <InspectorAction icon={SquarePen} label="Edit" accent="pink" onClick={() => setIsEditing(true)} />
            <InspectorAction icon={Pin} label={entry.pinned ? 'Unpin' : 'Pin'} accent="amber" onClick={() => togglePin(entry.id)} />
            <InspectorAction icon={Star} label={entry.favourite ? 'Unstar' : 'Star'} accent="amber" onClick={() => toggleFavourite(entry.id)} />
            <InspectorAction icon={Brain} label="AI Summary" accent="purple" onClick={handleGenerateSummary} />
            <InspectorAction icon={Archive} label={entry.archived ? 'Restore' : 'Archive'} accent="blue" onClick={() => toggleArchive(entry.id)} />
            <InspectorAction icon={Download} label="Export" accent="emerald" onClick={() => exportEntryToJSON(entry)} />
            <InspectorAction icon={Trash2} label="Delete" accent="red" onClick={handleDelete} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-component ────────────────────────────────────────────────────────────

type Accent = 'pink' | 'amber' | 'blue' | 'purple' | 'emerald' | 'red'

const accentMap: Record<Accent, string> = {
  pink:    'border-pink-500/20 bg-pink-500/5 text-pink-400 hover:bg-pink-500/15 hover:text-pink-300',
  amber:   'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 hover:text-amber-300',
  blue:    'border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/15 hover:text-blue-300',
  purple:  'border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/15 hover:text-purple-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300',
  red:     'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300',
}

function InspectorAction({
  icon: Icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ElementType
  label: string
  accent: Accent
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-medium transition-colors ${accentMap[accent]}`}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}
