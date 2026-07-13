import { SourceFile } from './interfaces';
import { fileManager } from './fileManager';

export class CodeSearch {
  /**
   * Search files whose name contains the search term.
   */
  public searchFilesByName(query: string): SourceFile[] {
    const cleanQuery = query.toLowerCase().trim();
    return fileManager.getFilesList().filter((f) => f.name.toLowerCase().includes(cleanQuery) || f.path.toLowerCase().includes(cleanQuery));
  }

  /**
   * Search raw text patterns in files and return matching line references.
   */
  public searchTextInFiles(query: string): { file: SourceFile; line: number; content: string }[] {
    const results: { file: SourceFile; line: number; content: string }[] = [];
    const cleanQuery = query.toLowerCase().trim();

    fileManager.getFilesList().forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(cleanQuery)) {
          results.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    return results.slice(0, 100);
  }

  /**
   * Identifies symbols such as classes, functions, and interfaces matching the search query.
   */
  public searchSymbols(symbolName: string): { file: SourceFile; line: number; content: string; type: string }[] {
    const results: { file: SourceFile; line: number; content: string; type: string }[] = [];
    const cleanSymbolName = symbolName.toLowerCase().trim();
    const regex = new RegExp(`\\b(class|function|interface|type|enum|const|let)\\s+([\\w_]+)\\b`, 'i');

    fileManager.getFilesList().forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        const match = line.match(regex);
        if (match && match[2].toLowerCase().includes(cleanSymbolName)) {
          results.push({
            file,
            line: index + 1,
            content: line.trim(),
            type: match[1]
          });
        }
      });
    });

    return results;
  }
}

export const codeSearch = new CodeSearch();
export default codeSearch;
