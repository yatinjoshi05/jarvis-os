// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — File Keyboard Shortcuts Hook (Phase 2.2 Explorer Intelligence Layer)
// Keybindings: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+F, Delete, F2, Escape, Enter, Up/Down
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useFilesStore } from '../model/useFilesStore'

export function useFileKeyboardShortcuts(
  searchInputRef?: React.RefObject<HTMLInputElement>,
  onStartRename?: () => void
) {
  const {
    cutItem,
    copyItem,
    pasteItem,
    deleteItem,
    selectAll,
    clearSearch,
    closeContextMenu,
    selectNextItem,
    selectPreviousItem,
    openItem,
    getSelectedItem,
  } = useFilesStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()

      // Escape key handles input blur, search clear, and context menu closing
      if (e.key === 'Escape') {
        if (targetTag === 'input' || targetTag === 'textarea') {
          if (searchInputRef?.current) searchInputRef.current.blur()
        }
        clearSearch()
        closeContextMenu()
        return
      }

      // If user is typing in inputs or textareas, skip shortcuts
      if (targetTag === 'input' || targetTag === 'textarea') {
        return
      }

      const isCtrl = e.ctrlKey || e.metaKey

      // Ctrl + C (Copy)
      if (isCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copyItem()
        return
      }

      // Ctrl + V (Paste)
      if (isCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        pasteItem()
        return
      }

      // Ctrl + X (Cut)
      if (isCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        cutItem()
        return
      }

      // Ctrl + A (Select All)
      if (isCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        selectAll()
        return
      }

      // Ctrl + F (Focus Search Input)
      if (isCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (searchInputRef?.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
        return
      }

      // Enter (Open Selected Item)
      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = getSelectedItem()
        if (selected) openItem(selected)
        return
      }

      // Arrow Down (Select Next Row Item)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        selectNextItem()
        return
      }

      // Arrow Up (Select Previous Row Item)
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        selectPreviousItem()
        return
      }

      // Delete (Delete Selected Items)
      if (e.key === 'Delete') {
        e.preventDefault()
        deleteItem()
        return
      }

      // F2 (Rename Selected Item)
      if (e.key === 'F2') {
        e.preventDefault()
        if (onStartRename) onStartRename()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    copyItem,
    pasteItem,
    cutItem,
    deleteItem,
    selectAll,
    clearSearch,
    closeContextMenu,
    selectNextItem,
    selectPreviousItem,
    openItem,
    getSelectedItem,
    searchInputRef,
    onStartRename,
  ])
}
