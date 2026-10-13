// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Files Module Store (Phase 2.2 Explorer Intelligence Layer)
// Multi-Selection Engine, Debounced Search, Multi-Column Sort, Keybindings
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import {
  ContextMenuState,
  ExplorerState,
  FileItem,
  NavigationState,
  SearchState,
  SortDirection,
  SortMode,
  ViewMode,
} from './types'
import { filesystemService, RealFilesystemService } from '../services/FilesystemService'

interface FilesStoreState {
  // Explorer Intelligence Core State
  files: FileItem[]
  selectedItems: string[]
  lastSelected: string | null
  selectedDrive: string
  currentPath: string
  userDirs: Record<string, string>
  loading: boolean
  error: string | null

  // Search Engine State
  searchQuery: string
  searchState: SearchState

  // Navigation State
  navigation: NavigationState

  // View & Sorting State
  viewMode: ViewMode
  sortMode: SortMode
  sortDirection: SortDirection

  // Clipboard & Context Menu State
  clipboardItem: FileItem | null
  clipboardAction: 'cut' | 'copy' | null
  contextMenu: ContextMenuState

  // Core Directory Operations
  loadUserDirs: () => Promise<void>
  loadDirectory: (path: string) => Promise<void>

  // Navigation System
  goBack: () => void
  goForward: () => void
  goToParent: () => void
  navigateTo: (pathParts: string[], absolutePath?: string) => void

  // Sidebar Shortcuts
  openDesktop: () => void
  openDownloads: () => void
  openDocuments: () => void
  openPictures: () => void
  openVideos: () => void
  openMusic: () => void
  openDrive: (driveLetter: string, driveName?: string) => void
  openNetwork: () => void

  // Search Engine Functions
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  filterResults: () => FileItem[]

  // Selection & Multi-Selection Engine Functions
  selectItem: (path: string) => void
  toggleSelection: (path: string) => void
  selectRange: (path: string) => void
  clearSelection: () => void
  selectAll: () => void

  // Context Menu & Item Operations
  showContextMenu: (e: React.MouseEvent, item: FileItem) => void
  closeContextMenu: () => void
  openItem: (item: FileItem) => Promise<void>

  // Creation Engine Functions
  createFolder: (name?: string) => Promise<void>
  createTextFile: (name?: string) => Promise<void>
  createMarkdown: (name?: string) => Promise<void>
  uploadFile: (fileName: string) => Promise<void>

  // Operations Engine Functions
  cutItem: (item?: FileItem) => void
  copyItem: (item?: FileItem) => void
  pasteItem: () => Promise<void>
  deleteItem: (path?: string) => Promise<void>
  renameItem: (oldPath: string, newName: string) => Promise<void>
  shareItem: (id?: string) => void

  // Keyboard Selection Navigation Functions
  selectNextItem: () => void
  selectPreviousItem: () => void

  // Sorting System Functions
  sortByName: () => void
  sortByDate: () => void
  sortBySize: () => void
  sortByType: () => void
  sortByExtension: () => void
  toggleDirection: () => void

  // View Modes Functions
  setViewMode: (mode: ViewMode) => void

  // State Persistence & Synchronization
  syncExplorer: () => ExplorerState
  persistPreferences: () => void

  // Selectors
  getFilteredAndSortedFiles: () => FileItem[]
  getSelectedItem: () => FileItem | undefined
}

export const useFilesStore = create<FilesStoreState>((set, get) => ({
  files: [],
  selectedItems: [],
  lastSelected: null,
  selectedDrive: 'C:',
  currentPath: 'C:\\Users\\Jarvis\\Downloads',
  userDirs: {},
  loading: false,
  error: null,

  searchQuery: '',
  searchState: {
    query: '',
    results: [],
    loading: false,
  },

  navigation: {
    currentPath: ['This PC', 'Windows (C:)', 'Users', 'Jarvis', 'Downloads'],
    history: [['This PC', 'Windows (C:)', 'Users', 'Jarvis', 'Downloads']],
    historyIndex: 0,
  },

  viewMode: 'list',
  sortMode: 'name',
  sortDirection: 'asc',

  clipboardItem: null,
  clipboardAction: null,
  contextMenu: { isOpen: false, x: 0, y: 0, targetItem: null },

  // User Directories Load
  loadUserDirs: async () => {
    const dirs = await filesystemService.getUserDirs()
    set({ userDirs: dirs })
  },

  // Directory Load Function
  loadDirectory: async (targetPath: string) => {
    set({ loading: true, error: null })

    try {
      console.log('Current path:', targetPath)
      console.log('Bridge:', (window as any).electron)
      console.log('Bridge:', (window as any).__TAURI__)

      const result = await filesystemService.readDirectory(targetPath)

      console.log('Files:', result)
      console.log('Count:', result.length)

      const parts = targetPath.split('\\').filter(Boolean)
      const breadcrumbParts = ['This PC']
      if (parts.length > 0) {
        if (parts[0].endsWith(':')) {
          breadcrumbParts.push(`Windows (${parts[0].toUpperCase()})`)
          breadcrumbParts.push(...parts.slice(1))
        } else {
          breadcrumbParts.push(...parts)
        }
      }

      set((state) => ({
        files: result,
        currentPath: targetPath,
        selectedItems: result.length > 0 ? [result[0].path] : [],
        lastSelected: result.length > 0 ? result[0].path : null,
        error: null,
        navigation: {
          ...state.navigation,
          currentPath: breadcrumbParts,
        },
      }))
    } catch (err: any) {
      console.error('Directory load failure:', err)
      set({ error: err?.message || 'Unable to load folder', files: [] })
    } finally {
      set({ loading: false })
    }
  },

  // Navigation Functions
  navigateTo: (newBreadcrumbs, absolutePath) => {
    const { navigation } = get()
    let targetPath = absolutePath

    if (!targetPath) {
      if (newBreadcrumbs.length >= 2 && newBreadcrumbs[0] === 'This PC') {
        const driveOrUser = newBreadcrumbs[1]
        if (driveOrUser.includes('C:')) {
          targetPath = 'C:\\' + newBreadcrumbs.slice(2).join('\\')
        } else if (driveOrUser.includes('D:')) {
          targetPath = 'D:\\' + newBreadcrumbs.slice(2).join('\\')
        } else {
          targetPath = 'C:\\Users\\Jarvis\\' + newBreadcrumbs.slice(1).join('\\')
        }
      } else {
        targetPath = 'C:\\Users\\Jarvis\\Downloads'
      }
    }

    if (newBreadcrumbs.join('/') === navigation.currentPath.join('/')) {
      get().loadDirectory(targetPath)
      return
    }

    const updatedHistory = [...navigation.history.slice(0, navigation.historyIndex + 1), newBreadcrumbs]
    set({
      navigation: {
        currentPath: newBreadcrumbs,
        history: updatedHistory,
        historyIndex: updatedHistory.length - 1,
      },
    })

    get().loadDirectory(targetPath)
  },

  goBack: () => {
    const { navigation } = get()
    if (navigation.historyIndex <= 0) return
    const newIndex = navigation.historyIndex - 1
    const newPathParts = navigation.history[newIndex]

    set({
      navigation: {
        ...navigation,
        currentPath: newPathParts,
        historyIndex: newIndex,
      },
    })

    const pathStr = 'C:\\' + newPathParts.slice(2).join('\\')
    get().loadDirectory(pathStr)
  },

  goForward: () => {
    const { navigation } = get()
    if (navigation.historyIndex >= navigation.history.length - 1) return
    const newIndex = navigation.historyIndex + 1
    const newPathParts = navigation.history[newIndex]

    set({
      navigation: {
        ...navigation,
        currentPath: newPathParts,
        historyIndex: newIndex,
      },
    })

    const pathStr = 'C:\\' + newPathParts.slice(2).join('\\')
    get().loadDirectory(pathStr)
  },

  goToParent: () => {
    const { currentPath, loadDirectory } = get()
    if (!currentPath || !currentPath.includes('\\')) return
    const parent = currentPath.substring(0, currentPath.lastIndexOf('\\')) || 'C:\\'
    loadDirectory(parent)
  },

  // Sidebar Shortcuts
  openDesktop: () => {
    const path = get().userDirs.desktop || 'C:\\Users\\Jarvis\\Desktop'
    get().loadDirectory(path)
  },

  openDownloads: () => {
    const path = get().userDirs.downloads || 'C:\\Users\\Jarvis\\Downloads'
    get().loadDirectory(path)
  },

  openDocuments: () => {
    const path = get().userDirs.documents || 'C:\\Users\\Jarvis\\Documents'
    get().loadDirectory(path)
  },

  openPictures: () => {
    const path = get().userDirs.pictures || 'C:\\Users\\Jarvis\\Pictures'
    get().loadDirectory(path)
  },

  openVideos: () => {
    const path = get().userDirs.videos || 'C:\\Users\\Jarvis\\Videos'
    get().loadDirectory(path)
  },

  openMusic: () => {
    const path = get().userDirs.music || 'C:\\Users\\Jarvis\\Music'
    get().loadDirectory(path)
  },

  openDrive: (driveLetter, _driveName) => {
    set({ selectedDrive: driveLetter })
    const drivePath = driveLetter.endsWith('\\') ? driveLetter : `${driveLetter}\\`
    get().loadDirectory(drivePath)
  },

  openNetwork: () => {
    get().loadDirectory('C:\\Users\\Jarvis')
  },

  // Search Engine
  setSearchQuery: (query) => {
    set((state) => ({
      searchQuery: query,
      searchState: { ...state.searchState, query },
    }))
  },

  clearSearch: () => {
    set((state) => ({
      searchQuery: '',
      searchState: { ...state.searchState, query: '', results: [] },
    }))
  },

  filterResults: () => get().getFilteredAndSortedFiles(),

  // Selection & Multi-Selection Engine
  selectItem: (pathStr) => {
    set({
      selectedItems: [pathStr],
      lastSelected: pathStr,
    })
  },

  toggleSelection: (pathStr) => {
    const { selectedItems } = get()
    const isSelected = selectedItems.includes(pathStr)
    const updated = isSelected ? selectedItems.filter((p) => p !== pathStr) : [...selectedItems, pathStr]
    set({
      selectedItems: updated,
      lastSelected: pathStr,
    })
  },

  selectRange: (targetPath) => {
    const { getFilteredAndSortedFiles, lastSelected, selectedItems } = get()
    const files = getFilteredAndSortedFiles()
    if (!lastSelected || files.length === 0) {
      set({ selectedItems: [targetPath], lastSelected: targetPath })
      return
    }

    const startIdx = files.findIndex((f) => f.path === lastSelected)
    const endIdx = files.findIndex((f) => f.path === targetPath)

    if (startIdx === -1 || endIdx === -1) {
      set({ selectedItems: [targetPath], lastSelected: targetPath })
      return
    }

    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)

    const rangePaths = files.slice(minIdx, maxIdx + 1).map((f) => f.path)
    const combinedSet = Array.from(new Set([...selectedItems, ...rangePaths]))

    set({
      selectedItems: combinedSet,
      lastSelected: targetPath,
    })
  },

  clearSelection: () => set({ selectedItems: [], lastSelected: null }),

  selectAll: () => {
    const files = get().getFilteredAndSortedFiles()
    set({
      selectedItems: files.map((f) => f.path),
      lastSelected: files.length > 0 ? files[0].path : null,
    })
  },

  // Selection Keyboard Navigation
  selectNextItem: () => {
    const files = get().getFilteredAndSortedFiles()
    const { lastSelected } = get()
    if (files.length === 0) return

    if (!lastSelected) {
      set({ selectedItems: [files[0].path], lastSelected: files[0].path })
      return
    }

    const currentIdx = files.findIndex((f) => f.path === lastSelected)
    const nextIdx = Math.min(files.length - 1, currentIdx + 1)
    const nextPath = files[nextIdx].path

    set({ selectedItems: [nextPath], lastSelected: nextPath })
  },

  selectPreviousItem: () => {
    const files = get().getFilteredAndSortedFiles()
    const { lastSelected } = get()
    if (files.length === 0) return

    if (!lastSelected) {
      set({ selectedItems: [files[0].path], lastSelected: files[0].path })
      return
    }

    const currentIdx = files.findIndex((f) => f.path === lastSelected)
    const prevIdx = Math.max(0, currentIdx - 1)
    const prevPath = files[prevIdx].path

    set({ selectedItems: [prevPath], lastSelected: prevPath })
  },

  // File Table & Context Menu Actions
  openItem: async (item) => {
    if (item.isDirectory || item.isFolder) {
      get().loadDirectory(item.path)
    } else {
      await filesystemService.openFile(item.path)
    }
  },

  showContextMenu: (e, item) => {
    e.preventDefault()
    set({
      selectedItems: [item.path || item.id || ''],
      lastSelected: item.path || item.id || '',
      contextMenu: {
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        targetItem: item,
      },
    })
  },

  closeContextMenu: () => {
    set((state) => ({
      contextMenu: { ...state.contextMenu, isOpen: false, targetItem: null },
    }))
  },

  // Creation Engine
  createFolder: async (name = 'New Folder') => {
    const { currentPath, loadDirectory } = get()
    await filesystemService.createFolder(currentPath, name)
    await loadDirectory(currentPath)
  },

  createTextFile: async (name = 'New Document.txt') => {
    const { currentPath, loadDirectory } = get()
    await filesystemService.createFile(currentPath, name)
    await loadDirectory(currentPath)
  },

  createMarkdown: async (name = 'Untitled.md') => {
    const { currentPath, loadDirectory } = get()
    await filesystemService.createFile(currentPath, name)
    await loadDirectory(currentPath)
  },

  uploadFile: async (fileName) => {
    const { currentPath, loadDirectory } = get()
    await filesystemService.createFile(currentPath, fileName)
    await loadDirectory(currentPath)
  },

  // Operations Engine
  cutItem: (targetItem) => {
    const item = targetItem || get().getSelectedItem()
    if (!item) return
    set({ clipboardItem: item, clipboardAction: 'cut' })
  },

  copyItem: (targetItem) => {
    const item = targetItem || get().getSelectedItem()
    if (!item) return
    set({ clipboardItem: item, clipboardAction: 'copy' })
  },

  pasteItem: async () => {
    const { clipboardItem, clipboardAction, currentPath, loadDirectory } = get()
    if (!clipboardItem || !clipboardAction) return

    const destPath = `${currentPath}\\${clipboardItem.name}`

    if (clipboardAction === 'copy') {
      await filesystemService.copyItem(clipboardItem.path, destPath)
    } else if (clipboardAction === 'cut') {
      await filesystemService.moveItem(clipboardItem.path, destPath)
      set({ clipboardItem: null, clipboardAction: null })
    }

    await loadDirectory(currentPath)
  },

  deleteItem: async (pathStr) => {
    const { selectedItems } = get()
    const targetPaths = pathStr ? [pathStr] : selectedItems
    if (targetPaths.length === 0) return

    const { currentPath, loadDirectory } = get()
    for (const p of targetPaths) {
      await filesystemService.deleteItem(p)
    }
    await loadDirectory(currentPath)
  },

  renameItem: async (oldPath, newName) => {
    const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'))
    const newPath = `${parentDir}\\${newName}`

    const { currentPath, loadDirectory } = get()
    await filesystemService.renameItem(oldPath, newPath)
    await loadDirectory(currentPath)
  },

  shareItem: (id) => {
    const item = id ? get().files.find((i) => (i.path || i.id) === id) : get().getSelectedItem()
    if (!item) return
  },

  // Sort Engine
  sortByName: () =>
    set((state) => ({
      sortMode: 'name',
      sortDirection: state.sortMode === 'name' && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  sortByDate: () =>
    set((state) => ({
      sortMode: 'date',
      sortDirection: state.sortMode === 'date' && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  sortBySize: () =>
    set((state) => ({
      sortMode: 'size',
      sortDirection: state.sortMode === 'size' && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  sortByExtension: () =>
    set((state) => ({
      sortMode: 'extension',
      sortDirection: state.sortMode === 'extension' && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  sortByType: () =>
    set((state) => ({
      sortMode: 'extension',
      sortDirection: state.sortMode === 'extension' && state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  toggleDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  // View Modes
  setViewMode: (mode) => set({ viewMode: mode }),

  // Explorer Sync & Persist
  syncExplorer: () => {
    const { currentPath, files, selectedItems, searchQuery, sortMode, viewMode } = get()
    return { currentPath, files, selectedItems, searchQuery, sortMode, viewMode }
  },

  persistPreferences: () => {
    const { viewMode, sortMode, sortDirection } = get()
    try {
      localStorage.setItem('jarvis_files_prefs', JSON.stringify({ viewMode, sortMode, sortDirection }))
    } catch (e) {
      // Ignored
    }
  },

  // Selectors
  getFilteredAndSortedFiles: () => {
    const { files, searchQuery, sortMode, sortDirection } = get()
    let filtered = files
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = files.filter((i) => i.name.toLowerCase().includes(q) || (i.extension || '').toLowerCase().includes(q))
    }

    const sortField: any = sortMode === 'extension' ? 'type' : sortMode
    return RealFilesystemService.sortFiles(filtered, sortField, sortDirection)
  },

  getSelectedItem: () => {
    const { files, selectedItems } = get()
    const activePath = selectedItems.length > 0 ? selectedItems[0] : ''
    return files.find((i) => i.path === activePath || i.id === activePath) || files[0]
  },
}))
