// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Real Windows Filesystem API Service (Phase 2.1)
// Connects directly to Node.js / Express native filesystem endpoints at /api/files
// ─────────────────────────────────────────────────────────────────────────────

import { FileItem, IFileSystemService, SortDirection, SortField } from '../model/types'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:3001'
const API_BASE = `${BACKEND_URL}/api/files`

export class RealFilesystemService implements IFileSystemService {
  /**
   * Print bridge debug diagnostics
   */
  static printBridgeDebug() {
    console.log('Bridge:', (window as any).electron)
    console.log('Bridge:', (window as any).__TAURI__)
  }

  /**
   * Convert API response item into normalized FileItem contract
   */
  private static normalizeItem(raw: any): FileItem {
    const isDir = Boolean(raw.isDirectory || raw.isFolder)
    const name = raw.name || ''
    const itemPath = raw.path || name
    const ext = raw.extension || (isDir ? '' : name.split('.').pop() || '').toLowerCase()

    let iconType: FileItem['iconType'] = isDir ? 'folder' : 'txt'
    if (isDir) {
      const lowerName = name.toLowerCase()
      if (lowerName === 'downloads') iconType = 'downloads'
      else if (lowerName === 'pictures') iconType = 'pictures'
      else if (lowerName === 'videos') iconType = 'videos'
      else if (lowerName === 'music') iconType = 'music'
    } else {
      if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) iconType = 'png'
      else if (['mp4', 'webm', 'mkv', 'avi'].includes(ext)) iconType = 'mp4'
      else if (ext === 'pdf') iconType = 'pdf'
      else if (ext === 'pptx' || ext === 'ppt') iconType = 'pptx'
      else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') iconType = 'xlsx'
      else if (ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'jsx') iconType = 'js'
      else if (ext === 'md') iconType = 'md'
    }

    const modifiedDate = raw.modifiedAt ? new Date(raw.modifiedAt) : new Date()
    const createdDate = raw.createdAt ? new Date(raw.createdAt) : new Date()

    const formattedDate = `${modifiedDate.getDate().toString().padStart(2, '0')}-${(modifiedDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${modifiedDate.getFullYear()} ${modifiedDate
      .getHours()
      .toString()
      .padStart(2, '0')}:${modifiedDate.getMinutes().toString().padStart(2, '0')} ${
      modifiedDate.getHours() >= 12 ? 'PM' : 'AM'
    }`

    let sizeStr = '--'
    const rawSizeBytes = typeof raw.size === 'number' ? raw.size : 0
    if (!isDir) {
      if (rawSizeBytes >= 1024 * 1024 * 1024) sizeStr = `${(rawSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      else if (rawSizeBytes >= 1024 * 1024) sizeStr = `${(rawSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      else if (rawSizeBytes >= 1024) sizeStr = `${(rawSizeBytes / 1024).toFixed(0)} KB`
      else sizeStr = `${rawSizeBytes} B`
    }

    return {
      name,
      path: itemPath,
      isDirectory: isDir,
      extension: ext,
      size: rawSizeBytes,
      createdAt: createdDate,
      modifiedAt: modifiedDate,

      // Compatibility props for design-frozen UI rendering
      id: itemPath,
      isFolder: isDir,
      type: isDir ? 'File folder' : ext ? `${ext.toUpperCase()} File` : 'Document',
      dateModified: formattedDate,
      sizeFormatted: sizeStr,
      iconType,
      location: itemPath.substring(0, itemPath.lastIndexOf('\\')) || 'C:\\Users\\Jarvis',
      createdDate: formattedDate,
    }
  }

  async getUserDirs(): Promise<Record<string, string>> {
    RealFilesystemService.printBridgeDebug()
    try {
      const res = await fetch(`${API_BASE}/user-dirs`)
      const data = await res.json()
      return data.success ? data.dirs : {}
    } catch (err) {
      return {}
    }
  }

  /**
   * STEP 2 & 4: readDirectory with strict 5-second timeout controller
   */
  async readDirectory(targetPath: string): Promise<FileItem[]> {
    RealFilesystemService.printBridgeDebug()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500) // Strict 4.5s max request timeout

    try {
      const res = await fetch(`${API_BASE}/read?path=${encodeURIComponent(targetPath)}`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied')
        if (res.status === 404) throw new Error('Folder not found')
        throw new Error('Unable to load folder')
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.files)) {
        return data.files.map((f: any) => RealFilesystemService.normalizeItem(f))
      }
      return []
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out (Reading Windows Directory took > 5s)')
      }
      throw err
    }
  }

  async getMetadata(targetPath: string): Promise<FileItem> {
    try {
      const res = await fetch(`${API_BASE}/metadata?path=${encodeURIComponent(targetPath)}`)
      const data = await res.json()
      return RealFilesystemService.normalizeItem(data.metadata)
    } catch (err) {
      return RealFilesystemService.normalizeItem({ name: targetPath, path: targetPath })
    }
  }

  async createFolder(targetPath: string, name: string = 'New Folder'): Promise<FileItem> {
    const res = await fetch(`${API_BASE}/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, name }),
    })
    const data = await res.json()
    return RealFilesystemService.normalizeItem(data.folder)
  }

  async createFile(targetPath: string, name: string = 'New Document.txt'): Promise<FileItem> {
    const res = await fetch(`${API_BASE}/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, name }),
    })
    const data = await res.json()
    return RealFilesystemService.normalizeItem(data.folder)
  }

  async deleteItem(targetPath: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath }),
    })
    const data = await res.json()
    return Boolean(data.success)
  }

  async renameItem(oldPath: string, newPath: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    })
    const data = await res.json()
    return Boolean(data.success)
  }

  async copyItem(source: string, target: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination: target }),
    })
    const data = await res.json()
    return Boolean(data.success)
  }

  async moveItem(source: string, target: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination: target }),
    })
    const data = await res.json()
    return Boolean(data.success)
  }

  async searchFiles(query: string, rootPath: string = ''): Promise<FileItem[]> {
    try {
      const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}&path=${encodeURIComponent(rootPath)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.results)) {
        return data.results.map((f: any) => RealFilesystemService.normalizeItem(f))
      }
      return []
    } catch (err) {
      return []
    }
  }

  async openFile(targetPath: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath }),
      })
      const data = await res.json()
      return Boolean(data.success)
    } catch (err) {
      return false
    }
  }

  /**
   * Sort files helper for frontend state
   */
  static sortFiles(files: FileItem[], field: SortField, direction: SortDirection): FileItem[] {
    return [...files].sort((a, b) => {
      let result = 0
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1

      switch (field) {
        case 'name':
          result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          break
        case 'date':
          result = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
          break
        case 'type':
        case 'extension':
          result = (a.extension || '').localeCompare(b.extension || '')
          break
        case 'size':
          result = a.size - b.size
          break
      }
      return direction === 'asc' ? result : -result
    })
  }
}

export const filesystemService = new RealFilesystemService()
