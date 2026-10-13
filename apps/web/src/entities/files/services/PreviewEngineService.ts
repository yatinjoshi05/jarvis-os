// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — File Preview Engine Service
// Renders and generates metadata for Folders, Images, Videos, PDFs, and Text
// ─────────────────────────────────────────────────────────────────────────────

import { FileItem, PreviewMetadata } from '../model/types'

export class PreviewEngineService {
  private static formatSize(item: FileItem): string {
    if (item.sizeFormatted) return item.sizeFormatted
    if (typeof item.size === 'number') {
      const bytes = item.size
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
      return `${bytes} B`
    }
    return String(item.size || '--')
  }

  static getPreview(item: FileItem | null): PreviewMetadata {
    if (!item) {
      return {
        type: 'folder',
        itemCount: 13572,
        sizeFormatted: '12.6 GB',
        createdDate: '14-02-2026 10:22 AM',
      }
    }

    if (item.isDirectory || item.isFolder) {
      return this.previewFolder(item)
    }

    const name = item.name.toLowerCase()

    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.svg')) {
      return this.previewImage(item)
    }

    if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mkv')) {
      return this.previewVideo(item)
    }

    if (name.endsWith('.pdf')) {
      return this.previewPDF(item)
    }

    if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.js') || name.endsWith('.json')) {
      return this.previewText(item)
    }

    return {
      type: 'text',
      textContent: `Binary data file (${item.type || 'File'}) - ${this.formatSize(item)}`,
    }
  }

  static previewFolder(item: FileItem): PreviewMetadata {
    return {
      type: 'folder',
      itemCount: item.totalFilesCount ? parseInt(item.totalFilesCount) : 42,
      sizeFormatted: this.formatSize(item) === '--' ? '12.6 GB' : this.formatSize(item),
      createdDate: item.createdDate || '14-02-2026 10:22 AM',
    }
  }

  static previewImage(item: FileItem): PreviewMetadata {
    return {
      type: 'image',
      previewUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop`,
      sizeFormatted: this.formatSize(item),
      createdDate: item.createdDate || '28-07-2026 07:00 PM',
    }
  }

  static previewVideo(item: FileItem): PreviewMetadata {
    return {
      type: 'video',
      previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      sizeFormatted: this.formatSize(item),
      createdDate: item.createdDate || '28-07-2026 09:30 PM',
    }
  }

  static previewPDF(item: FileItem): PreviewMetadata {
    return {
      type: 'pdf',
      textContent: `PDF Document: ${item.name}\nVector graphics schema & architectural blueprint specs.`,
      sizeFormatted: this.formatSize(item),
      createdDate: item.createdDate || '30-07-2026 10:30 AM',
    }
  }

  static previewText(item: FileItem): PreviewMetadata {
    const isMd = item.name.endsWith('.md')
    const sampleText = isMd
      ? `# JARVIS OS Module Specification\n- Version: 1.0.0\n- Status: Phase 2 Active\n- Core System Standby`
      : `JARVIS System Logs\n[INFO] Core Memory Engine online\n[INFO] Filesystem Service initialized successfully.`

    return {
      type: 'text',
      textContent: item.content || sampleText,
      sizeFormatted: this.formatSize(item),
      createdDate: item.createdDate || '28-07-2026 04:20 PM',
    }
  }
}
