// ─────────────────────────────────────────────
// JARVIS OS — ContextMenu
// Right-click actions for a memory entry
// ─────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import {
  Pin,
  Star,
  Archive,
  Copy,
  Trash2,
  SquarePen,
} from 'lucide-react'
import { useMemoryStore } from '../model/store'
import { ContextMenuState } from '../model/types'

interface ContextMenuProps {
  menu: ContextMenuState
  onClose: () => void
  onEdit: (id: string) => void
}

interface MenuItem {
  label: string
  icon: React.ElementType
  danger?: boolean
  action: () => void
}

export function ContextMenu({ menu, onClose, onEdit }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { togglePin, toggleFavourite, toggleArchive, duplicateMemory, deleteMemory, memories } =
    useMemoryStore()

  const entry = memories.find((m) => m.id === menu.memoryId)

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  if (!entry) return null

  const items: MenuItem[] = [
    {
      label: 'Edit',
      icon: SquarePen,
      action: () => {
        onEdit(entry.id)
        onClose()
      },
    },
    {
      label: entry.pinned ? 'Unpin' : 'Pin',
      icon: Pin,
      action: () => {
        togglePin(entry.id)
        onClose()
      },
    },
    {
      label: entry.favourite ? 'Unfavourite' : 'Favourite',
      icon: Star,
      action: () => {
        toggleFavourite(entry.id)
        onClose()
      },
    },
    {
      label: entry.archived ? 'Restore' : 'Archive',
      icon: Archive,
      action: () => {
        toggleArchive(entry.id)
        onClose()
      },
    },
    {
      label: 'Duplicate',
      icon: Copy,
      action: () => {
        duplicateMemory(entry.id)
        onClose()
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      danger: true,
      action: () => {
        deleteMemory(entry.id)
        onClose()
      },
    },
  ]

  // Keep menu within viewport
  const left = Math.min(menu.x, window.innerWidth - 180)
  const top = Math.min(menu.y, window.innerHeight - items.length * 36 - 16)

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[100] min-w-[168px] rounded-xl border border-white/10 bg-[#0c121e] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.action}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors ${
            item.danger
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
          role="menuitem"
        >
          <item.icon size={13} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
