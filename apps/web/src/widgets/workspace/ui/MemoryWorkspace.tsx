// ─────────────────────────────────────────────
// JARVIS OS — Memory Workspace
// Phase 2.2 — Memory Intelligence integrated
// Visual design: FROZEN — do not modify layout / spacing / typography
// Intelligence panels are ADDITIVE inside existing containers.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  MessageSquare,
  BookOpen,
  FolderOpen,
  Clock,
  Search,
  Plus,
  ChevronDown,
  Lock,
  ArrowRight,
  Settings,
  Download,
  X,
  Sparkles,
  TrendingUp,
  Flame,
  Tag,
  Activity,
  GitBranch,
  RefreshCw,
} from 'lucide-react'

// Memory entity — store, hooks, components, services
import { useMemoryStore } from '../../../entities/memory/model/store'
import { useMemorySearch } from '../../../entities/memory/hooks/useMemorySearch'
import { useMemoryStats } from '../../../entities/memory/hooks/useMemoryStats'
import { MemoryTimeline } from '../../../entities/memory/ui/MemoryTimeline'
import { MemoryInspector } from '../../../entities/memory/ui/MemoryInspector'
import { ContextMenu } from '../../../entities/memory/ui/ContextMenu'
import { EmptyState } from '../../../entities/memory/ui/EmptyState'
import {
  exportToJSON,
  exportToMarkdown,
  importFromJSONFile,
} from '../../../entities/memory/services/memoryImportExport'
import { MemoryType, MemoryFilter, ContextMenuState } from '../../../entities/memory/model/types'
// Phase 2.2 — Intelligence
import { useMemoryInsights } from '../../../entities/memory/intelligence/useMemoryInsights'
import { useSemanticSearch } from '../../../entities/memory/intelligence/useSemanticSearch'

// ── Filter chip definitions ───────────────────────────────────────────────────
const FILTER_CHIPS: Array<{ label: string; value: MemoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Conversations', value: 'conversation' },
  { label: 'Knowledge', value: 'knowledge' },
  { label: 'Preferences', value: 'preference' },
  { label: 'Files', value: 'file' },
  { label: 'Missions', value: 'mission' },
  { label: 'Pinned', value: 'pinned' },
]

// Modal category options
const MODAL_CATEGORIES: Array<{ label: string; value: MemoryType }> = [
  { label: 'Knowledge', value: 'knowledge' },
  { label: 'Conversations', value: 'conversation' },
  { label: 'Missions', value: 'mission' },
  { label: 'Files', value: 'file' },
  { label: 'Preferences', value: 'preference' },
  { label: 'Projects', value: 'project' },
  { label: 'Note', value: 'manual' },
]

// Max visible memories before "View All" appears
const PAGE_SIZE = 10

export default function MemoryWorkspace() {
  // ── Store ─────────────────────────────────────────────────────────────────
  const {
    selectedId,
    searchQuery,
    activeFilter,
    memories,
    hydrate,
    addMemory,
    setSelected,
    setSearchQuery,
    setFilter,
    importMemories,
  } = useMemoryStore()

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { filteredMemories, groupedMemories, isFiltering } = useMemorySearch()
  const { stats, donutSegments, legendItems } = useMemoryStats()
  const { insights, isLoading: insightsLoading, refresh: refreshInsights, dismiss: dismissInsight } = useMemoryInsights()
  const { isSemantic, isLoading: semanticLoading } = useSemanticSearch(searchQuery)

  // ── Local UI state ────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Modal form state
  const [newTitle, setNewTitle] = useState('')
  const [newSummary, setNewSummary] = useState('')
  const [newCategory, setNewCategory] = useState<MemoryType>('knowledge')

  // ── Hydrate on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Reset pagination when filter/search changes
  useEffect(() => {
    setShowAll(false)
  }, [searchQuery, activeFilter])

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return
    const close = () => setShowExportMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showExportMenu])

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleMemories = showAll
    ? filteredMemories
    : filteredMemories.slice(0, PAGE_SIZE)

  // Regroup only the visible slice
  const visibleGroups = groupedMemories.map((g) => ({
    ...g,
    entries: g.entries.filter((e) => visibleMemories.includes(e)),
  })).filter((g) => g.entries.length > 0)

  const hasMore = !showAll && filteredMemories.length > PAGE_SIZE

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newSummary.trim()) return
    addMemory({
      title: newTitle.trim(),
      summary: newSummary.trim(),
      content: newSummary.trim(),
      type: newCategory,
      tags: [],
      pinned: false,
      archived: false,
      favourite: false,
      source: 'manual',
      relatedMemoryIds: [],
      metadata: { importance: 5, confidence: 1.0 },
      author: 'user',
    })
    setNewTitle('')
    setNewSummary('')
    setNewCategory('knowledge')
    setIsAddModalOpen(false)
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, memoryId: string) => {
      setContextMenu({ x: e.clientX, y: e.clientY, memoryId })
    },
    []
  )

  const handleImport = async () => {
    setImportError(null)
    const result = await importFromJSONFile()
    if (result.errors.length > 0 && result.entries.length === 0) {
      setImportError(result.errors[0])
      return
    }
    importMemories(result.entries)
    setImportSuccess(true)
    setTimeout(() => setImportSuccess(false), 3000)
  }

  const handleFocusSearch = () => {
    const el = document.querySelector<HTMLInputElement>(
      'input[placeholder="Search memories..."]'
    )
    el?.focus()
  }

  // ── Last sync display ─────────────────────────────────────────────────────
  const lastSyncDate = new Date(stats.lastSync)
  const lastSyncTime = lastSyncDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const lastSyncDateStr = lastSyncDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#080d16] p-6 text-white hide-scrollbar">
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.25)]">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Memory</h1>
            <p className="mt-0.5 text-xs text-white/50">
              {stats.total > 0
                ? `${stats.total.toLocaleString()} memories · ${stats.weeklyDelta} added this week`
                : 'Your AI remembers so you can focus.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-pink-500/50 bg-pink-500/10 px-3.5 py-1.5 text-xs font-semibold text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.2)] transition-all hover:bg-pink-500/20 hover:text-white"
          >
            <Plus size={14} />
            <span>Add Memory</span>
          </button>

          {/* Import / Export dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowExportMenu((v) => !v)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
            >
              <Download size={13} />
              <span>{importSuccess ? '✓ Imported!' : 'Import / Export'}</span>
              <ChevronDown size={13} className="text-white/40" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[168px] rounded-xl border border-white/10 bg-[#0c121e] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <button
                  type="button"
                  onClick={() => { handleImport(); setShowExportMenu(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Import JSON
                </button>
                <button
                  type="button"
                  onClick={() => { exportToJSON(memories); setShowExportMenu(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => { exportToMarkdown(memories); setShowExportMenu(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Export Markdown
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          <span className="flex-1">{importError}</span>
          <button type="button" onClick={() => setImportError(null)} className="text-red-400 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── 2. CONTROL BAR ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-between gap-4">
        {/* Search bar — Phase 2.2: semantic indicator */}
        <div className="relative w-80">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-xl border border-white/10 bg-white/[.03] py-2 pl-3.5 pr-9 text-xs text-white placeholder-white/40 transition-all focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
            />
            {semanticLoading ? (
              <RefreshCw size={13} className="absolute right-3 text-pink-400/70 animate-spin" />
            ) : isSemantic ? (
              <span className="absolute right-2 flex items-center gap-0.5 rounded-md bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-400">
                <Sparkles size={8} /> AI
              </span>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-white/30 hover:text-white"
              >
                <X size={13} />
              </button>
            ) : (
              <Search size={14} className="absolute right-3 text-white/40" />
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2">
          {FILTER_CHIPS.map(({ label, value }) => {
            const isActive = activeFilter === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 3. STAT CARDS ─────────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-5 gap-3.5">
        {/* Total Memories */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c121e]/80 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10 text-pink-400">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40">Total Memories</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
              {stats.total.toLocaleString()}
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
              ↑ {stats.weeklyDelta} this week
            </p>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c121e]/80 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40">Conversations</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
              {(stats.byType.conversation ?? 0).toLocaleString()}
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
              {stats.byType.conversation > 0 ? 'Active' : 'None yet'}
            </p>
          </div>
        </div>

        {/* Knowledge */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c121e]/80 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40">Knowledge Items</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
              {(stats.byType.knowledge ?? 0).toLocaleString()}
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
              {stats.byType.knowledge > 0 ? 'Indexed' : 'None yet'}
            </p>
          </div>
        </div>

        {/* Files */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c121e]/80 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <FolderOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40">Files Remembered</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
              {(stats.byType.file ?? 0).toLocaleString()}
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
              {stats.byType.file > 0 ? 'Tracked' : 'None yet'}
            </p>
          </div>
        </div>

        {/* Last Synced */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c121e]/80 p-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/40">Last Synced</p>
            <h3 className="mt-0.5 text-base font-bold tracking-tight text-white">
              {lastSyncTime}
            </h3>
            <p className="mt-0.5 text-[10px] text-white/40">{lastSyncDateStr}</p>
          </div>
        </div>
      </div>

      {/* ── 4. MAIN SPLIT ─────────────────────────────────────────────────── */}
      <div className="mt-5 grid min-h-0 flex-1 grid-cols-[68%_30%] gap-[2%]">

        {/* ── LEFT 68% — TIMELINE ────────────────────────────────────────── */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
          <div>
            <h2 className="mb-5 text-sm font-bold tracking-tight text-white">
              Recent Memories
              {isFiltering && filteredMemories.length > 0 && (
                <span className="ml-2 text-[10px] font-normal text-white/40">
                  {filteredMemories.length} result{filteredMemories.length !== 1 ? 's' : ''}
                </span>
              )}
            </h2>

            {visibleGroups.length === 0 ? (
              <EmptyState
                query={searchQuery}
                isFiltering={isFiltering}
                onClear={() => {
                  setSearchQuery('')
                  setFilter('all')
                }}
              />
            ) : (
              <MemoryTimeline
                groups={visibleGroups}
                selectedId={selectedId}
                onContextMenu={handleContextMenu}
              />
            )}
          </div>

          {/* Footer: View All / Show Less */}
          <div className="mt-6 border-t border-white/5 pt-4 text-center">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 transition-colors hover:text-pink-300 hover:underline"
              >
                <span>View all {filteredMemories.length} memories</span>
                <ArrowRight size={13} />
              </button>
            ) : showAll && filteredMemories.length > PAGE_SIZE ? (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 transition-colors hover:text-white"
              >
                Show less
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 transition-colors hover:text-pink-300 hover:underline"
              >
                <span>Add Memory</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT 30% — INSPECTOR or INSIGHTS ──────────────────────────── */}
        <div className="space-y-4">
          {selectedId ? (
            // Memory Inspector replaces insight cards when a memory is selected
            <MemoryInspector />
          ) : (
            <>
              {/* Memory Insights — Donut Chart */}
              <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
                <h3 className="mb-4 text-xs font-bold tracking-tight text-white">
                  Memory Insights
                </h3>
                <div className="flex items-center justify-between gap-2">
                  {/* Donut SVG */}
                  <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      {/* Track */}
                      <path
                        className="text-white/5"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Dynamic segments */}
                      {donutSegments.map((seg) => (
                        <path
                          key={seg.type}
                          className={seg.arcColor}
                          strokeDasharray={`${seg.dash.toFixed(2)}, 100`}
                          strokeDashoffset={String(seg.offset.toFixed(2))}
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-bold leading-none tracking-tight text-white">
                        {stats.total.toLocaleString()}
                      </span>
                      <span className="mt-0.5 text-[9px] font-medium uppercase text-white/40">
                        Total
                      </span>
                    </div>
                  </div>

                  {/* Legend — dynamic */}
                  <div className="flex-1 space-y-1.5 pl-2 text-[10px]">
                    {legendItems.length > 0 ? (
                      legendItems.map((item) => (
                        <div key={item.type} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-white/70">
                            <span className={`h-2 w-2 rounded-full ${item.dotColor}`} />
                            {item.label}
                          </span>
                          <span className="font-bold text-white">{item.pct}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-white/30">No memories yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Topics */}
              <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
                <h3 className="mb-3 text-xs font-bold tracking-tight text-white">
                  Top Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Insights — Phase 2.2 */}
              <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-white">
                    <Sparkles size={12} className="text-pink-400" /> AI Insights
                  </h3>
                  <button
                    type="button"
                    onClick={refreshInsights}
                    disabled={insightsLoading}
                    className="text-white/20 hover:text-white/60 transition-colors"
                    title="Refresh insights"
                  >
                    <RefreshCw size={11} className={insightsLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                {insightsLoading && insights.length === 0 ? (
                  <p className="text-[10px] text-white/25 italic">Analysing your memories…</p>
                ) : insights.length === 0 ? (
                  <p className="text-[10px] text-white/25 italic">Add more memories to unlock insights.</p>
                ) : (
                  <div className="space-y-2">
                    {insights.slice(0, 4).map(insight => (
                      <div
                        key={insight.id}
                        className="group relative flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[.02] p-2.5"
                      >
                        <InsightIcon category={insight.category} iconName={insight.icon} />
                        <p className="flex-1 text-[10px] leading-relaxed text-white/60">{insight.text}</p>
                        <button
                          type="button"
                          onClick={() => dismissInsight(insight.id)}
                          className="absolute right-2 top-2 text-white/15 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white/50"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl border border-white/10 bg-[#0c121e]/80 p-5">
                <h3 className="mb-3 text-xs font-bold tracking-tight text-white">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <QuickAction
                    icon={Plus}
                    label="Add Memory"
                    description="Manually add important information"
                    accent="purple"
                    hoverAccent="pink"
                    onClick={() => setIsAddModalOpen(true)}
                  />
                  <QuickAction
                    icon={Search}
                    label="Search Memory"
                    description="Find anything you remembered"
                    accent="emerald"
                    hoverAccent="emerald"
                    onClick={handleFocusSearch}
                  />
                  <QuickAction
                    icon={Settings}
                    label="Memory Settings"
                    description="Manage memory & privacy"
                    accent="blue"
                    hoverAccent="blue"
                    onClick={() => {/* future: navigate to settings memory tab */}}
                  />
                  <QuickAction
                    icon={Download}
                    label="Import / Export Data"
                    description="Backup or restore your memory"
                    accent="emerald"
                    hoverAccent="emerald"
                    onClick={handleImport}
                  />
                </div>
              </div>

              {/* Privacy Card */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-3.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/90">
                    Your memory is private and secure.
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    100% local encryption &bull; You own your data
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ADD MEMORY MODAL ──────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-pink-500/30 bg-[#080d16] p-6 shadow-[0_0_40px_rgba(236,72,153,0.2)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-pink-400">
                <Brain size={18} />
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Add New Memory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMemorySubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-white/40">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Client ABC Investment Plan"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-pink-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-white/40">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryType)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c121e] px-3 py-2 text-xs text-white focus:border-pink-500/50 focus:outline-none"
                >
                  {MODAL_CATEGORIES.map(({ label, value }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-white/40">
                  Summary / Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Enter memory details..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-pink-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-pink-500/50 bg-pink-500/20 px-4 py-1.5 text-xs font-semibold text-pink-200 hover:bg-pink-500/30 hover:text-white"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RIGHT-CLICK CONTEXT MENU ──────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onEdit={(id) => setSelected(id)}
        />
      )}
    </div>
  )
}

// ── Sub-component: AI Insight Icon ────────────────────────────────────────────

const INSIGHT_ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Flame, Tag, Activity, GitBranch, Clock,
}

const INSIGHT_COLOR_MAP: Record<string, string> = {
  frequency: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  streak: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  stale: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'cross-reference': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  activity: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  default: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

function InsightIcon({ category, iconName }: { category: string; iconName?: string }) {
  const Icon = (iconName && INSIGHT_ICON_MAP[iconName]) ? INSIGHT_ICON_MAP[iconName] : Sparkles
  const colorClass = INSIGHT_COLOR_MAP[category] ?? INSIGHT_COLOR_MAP.default
  return (
    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border ${colorClass}`}>
      <Icon size={11} />
    </div>
  )
}

// ── Sub-component: Quick Action row ──────────────────────────────────────────

const accentBorderMap: Record<string, string> = {
  purple: 'hover:border-pink-500/40 hover:bg-pink-500/10',
  emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/10',
  blue: 'hover:border-blue-500/40 hover:bg-blue-500/10',
}

const iconAccentMap: Record<string, string> = {
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
}

const labelHoverMap: Record<string, string> = {
  purple: 'group-hover:text-pink-300',
  emerald: 'group-hover:text-emerald-300',
  blue: 'group-hover:text-blue-300',
}

function QuickAction({
  icon: Icon,
  label,
  description,
  accent,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  accent: string
  hoverAccent: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-2.5 text-left transition-all ${accentBorderMap[accent] ?? ''}`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${iconAccentMap[accent] ?? ''}`}
      >
        <Icon size={14} />
      </div>
      <div>
        <p className={`text-xs font-semibold text-white ${labelHoverMap[accent] ?? ''}`}>
          {label}
        </p>
        <p className="text-[9px] text-white/40">{description}</p>
      </div>
    </button>
  )
}
