// ─────────────────────────────────────────────
// JARVIS OS — EmptyState
// Zero-result friendly UI for the memory timeline
// ─────────────────────────────────────────────

import { Brain, Search, X } from 'lucide-react'

interface EmptyStateProps {
  query: string
  isFiltering: boolean
  onClear: () => void
}

export function EmptyState({ query, isFiltering, onClear }: EmptyStateProps) {
  const isSearch = query.trim().length > 0

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/5 text-pink-400/60">
        {isSearch ? <Search size={28} /> : <Brain size={28} />}
      </div>

      <h4 className="mt-4 text-sm font-bold text-white/60">
        {isSearch ? 'No memories found' : 'Nothing here yet'}
      </h4>

      <p className="mt-1.5 max-w-xs text-[11px] text-white/30 leading-relaxed">
        {isSearch
          ? `No memories match "${query}". Try a different search term or clear your filters.`
          : isFiltering
          ? 'No memories in this category. Try a different filter.'
          : 'JARVIS will remember things as you work. Add your first memory to get started.'}
      </p>

      {isFiltering && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
        >
          <X size={12} />
          Clear filters
        </button>
      )}
    </div>
  )
}
