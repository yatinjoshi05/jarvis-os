import { eventBus } from '../model/eventBus'
import type { ActivityEvent } from '../model/types'

export interface FileEntry {
  path: string
  name: string
  isDirectory: boolean
  sizeBytes?: number
  updatedAt: string
}

class FileSystemService {
  private fileCache = new Map<string, FileEntry>()
  private contentCache = new Map<string, string>()

  public async writeFile(missionId: string, path: string, content: string): Promise<boolean> {
    const filename = path.split('/').pop() || path
    const now = new Date().toISOString()

    const entry: FileEntry = {
      path,
      name: filename,
      isDirectory: false,
      sizeBytes: content.length,
      updatedAt: now,
    }

    this.fileCache.set(path, entry)
    this.contentCache.set(path, content)

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const fileEvent: ActivityEvent = {
      id: `file-evt-${Date.now()}`,
      time: timeString,
      title: filename,
      subtitle: 'Created & Written',
      iconName: 'Braces',
      tone: {
        card: 'border-fuchsia-500/40 bg-fuchsia-500/[.05]',
        iconBox: 'border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
        line: 'bg-fuchsia-400/50',
        node: 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]',
      },
    }

    eventBus.publish('FILE_CREATED', missionId, fileEvent)
    return true
  }

  public async readFile(path: string): Promise<string | null> {
    return this.contentCache.get(path) || null
  }

  public async createDirectory(missionId: string, dirPath: string): Promise<boolean> {
    const dirName = dirPath.split('/').pop() || dirPath
    const now = new Date().toISOString()

    const entry: FileEntry = {
      path: dirPath,
      name: dirName,
      isDirectory: true,
      updatedAt: now,
    }

    this.fileCache.set(dirPath, entry)
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const dirEvent: ActivityEvent = {
      id: `dir-evt-${Date.now()}`,
      time: timeString,
      title: dirName,
      subtitle: 'Directory Created',
      iconName: 'FolderOpen',
      tone: {
        card: 'border-emerald-500/40 bg-emerald-500/[.05]',
        iconBox: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        line: 'bg-emerald-400/50',
        node: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      },
    }

    eventBus.publish('FILE_CREATED', missionId, dirEvent)
    return true
  }

  public async deleteFile(missionId: string, path: string): Promise<boolean> {
    const exists = this.fileCache.has(path)
    if (!exists) return false

    this.fileCache.delete(path)
    this.contentCache.delete(path)

    const filename = path.split('/').pop() || path
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    eventBus.publish('FILE_CREATED', missionId, {
      id: `del-evt-${Date.now()}`,
      time: timeString,
      title: filename,
      subtitle: 'Deleted',
      iconName: 'Trash2',
      tone: {
        card: 'border-rose-500/40 bg-rose-500/[.05]',
        iconBox: 'border border-rose-500/30 bg-rose-500/10 text-rose-300',
        line: 'bg-rose-400/50',
        node: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
      },
    } as ActivityEvent)

    return true
  }

  public listFiles(): FileEntry[] {
    return Array.from(this.fileCache.values())
  }
}

export const fileSystemService = new FileSystemService()
