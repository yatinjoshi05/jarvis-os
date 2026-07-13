import { Document } from './interfaces';
import { DocumentType } from './types';

export class DocumentReader {
  /**
   * Parses contents from TXT, CSV, PDF, Markdown, and JSON structures and compiles structural metadata.
   */
  public readDocument(name: string, type: DocumentType, content: string): Document {
    const sizeBytes = content.length;
    const metadata: Record<string, any> = {
      parsedAt: Date.now()
    };

    if (type === 'csv') {
      const lines = content.split('\n');
      metadata.rowsCount = lines.length;
      metadata.columnsCount = lines[0] ? lines[0].split(',').length : 0;
    } else if (type === 'json') {
      try {
        const parsed = JSON.parse(content);
        metadata.keys = Object.keys(parsed);
        metadata.isJsonObject = true;
      } catch (_) {
        metadata.isJsonObject = false;
        metadata.error = 'Invalid JSON format.';
      }
    } else if (type === 'markdown') {
      const headingCount = (content.match(/^#+\s+/gm) || []).length;
      metadata.headingsCount = headingCount;
    } else if (type === 'pdf') {
      metadata.simulatedPageCount = Math.max(1, Math.ceil(sizeBytes / 2000));
    }

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type,
      content,
      metadata,
      sizeBytes
    };
  }
}

export const documentReader = new DocumentReader();
export default documentReader;
