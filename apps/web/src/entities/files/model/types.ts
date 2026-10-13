// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Real Windows File System Types (Phase 2.2 Explorer Intelligence)
// ─────────────────────────────────────────────────────────────────────────────

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  extension: string
  size: number
  createdAt: Date
  modifiedAt: Date

  // Computed / UI compatibility props (frozen UI rendering)
  id?: string
  type?: string
  dateModified?: string
  isFolder?: boolean
  sizeFormatted?: string
  iconType?: 'folder' | 'downloads' | 'pictures' | 'videos' | 'music' | 'txt' | 'md' | 'pdf' | 'pptx' | 'xlsx' | 'mp4' | 'png' | 'js'
  location?: string
  createdDate?: string
  totalFilesCount?: string
  content?: string
}

export type ViewMode = 'list' | 'grid' | 'compact'
export type SortMode = 'name' | 'date' | 'size' | 'extension' | 'type'
export type SortField = SortMode
export type SortDirection = 'asc' | 'desc'

export interface SearchState {
  query: string
  results: FileItem[]
  loading: boolean
}

export interface SelectionState {
  selected: string[]
  lastSelected: string | null
}

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  targetItem: FileItem | null
}

export interface NavigationState {
  currentPath: string[]
  history: string[][]
  historyIndex: number
}

export interface PreviewMetadata {
  type: 'folder' | 'image' | 'video' | 'pdf' | 'text'
  previewUrl?: string
  textContent?: string
  itemCount?: number
  sizeFormatted?: string
  createdDate?: string
}

export interface AIResponse {
  type: 'summary' | 'analysis' | 'extraction' | 'answer'
  text: string
  timestamp: string
}

export interface ExplorerState {
  currentPath: string
  files: FileItem[]
  selectedItems: string[]
  searchQuery: string
  sortMode: SortMode
  viewMode: string
}

export interface IFileSystemService {
  readDirectory(path: string): Promise<FileItem[]>
  getMetadata(path: string): Promise<FileItem>
  createFolder(path: string, name?: string): Promise<FileItem>
  createFile(path: string, name?: string): Promise<FileItem>
  deleteItem(path: string): Promise<boolean>
  renameItem(oldPath: string, newPath: string): Promise<boolean>
  copyItem(source: string, target: string): Promise<boolean>
  moveItem(source: string, target: string): Promise<boolean>
  searchFiles(query: string, rootPath?: string): Promise<FileItem[]>
  openFile(path: string): Promise<boolean>
  getUserDirs(): Promise<Record<string, string>>
}
