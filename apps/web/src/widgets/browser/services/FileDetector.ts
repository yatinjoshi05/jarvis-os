export type ViewerMode = 'pdf' | 'image' | 'code' | 'text' | 'office' | 'web';

export interface FileMetadata {
  name: string;
  extension: string;
  viewerMode: ViewerMode;
  mimeType: string;
}

export class FileDetectorService {
  private static extensionMap: Record<string, ViewerMode> = {
    // PDF
    pdf: 'pdf',

    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    webp: 'image',
    svg: 'image',
    gif: 'image',
    bmp: 'image',
    ico: 'image',

    // Code & Structured Data
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    html: 'code',
    htm: 'code',
    css: 'code',
    scss: 'code',
    json: 'code',
    xml: 'code',
    yaml: 'code',
    yml: 'code',
    py: 'code',
    rs: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    go: 'code',
    sql: 'code',
    sh: 'code',
    bat: 'code',

    // Plain Text & Markdown
    txt: 'text',
    md: 'text',
    markdown: 'text',
    log: 'text',
    csv: 'text',

    // Office Documents
    docx: 'office',
    doc: 'office',
    xlsx: 'office',
    xls: 'office',
    pptx: 'office',
    ppt: 'office',
  };

  public static detect(fileName: string): FileMetadata {
    const cleanName = fileName.trim();
    const parts = cleanName.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    const viewerMode = this.extensionMap[extension] || 'web';

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      gif: 'image/gif',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      json: 'application/json',
      txt: 'text/plain',
      md: 'text/markdown',
    };

    return {
      name: cleanName,
      extension,
      viewerMode,
      mimeType: mimeTypes[extension] || 'text/plain',
    };
  }
}
