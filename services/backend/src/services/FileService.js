import fs from 'fs';
import path from 'path';

/**
 * FileService — Public API for Safe Workspace File IO, Search & Indexing
 */
export class FileService {
  /**
   * Safely write content to target path on disk
   */
  static async writeFile(targetPath, content = '') {
    if (!targetPath) throw new Error('Target file path required.');
    try {
      const absolutePath = path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
      const parentDir = path.dirname(absolutePath);
      if (!fs.existsSync(parentDir)) {
        await fs.promises.mkdir(parentDir, { recursive: true });
      }
      await fs.promises.writeFile(absolutePath, content, 'utf-8');
      const stats = await fs.promises.stat(absolutePath);
      console.log(`[FileService] Wrote ${stats.size} bytes to ${absolutePath}`);
      return { success: true, filePath: absolutePath, bytesWritten: stats.size };
    } catch (err) {
      console.error(`[FileService] File write error:`, err.message);
      throw new Error(`FileService Error: ${err.message}`);
    }
  }

  /**
   * Read file content from disk
   */
  static async readFile(filePath) {
    if (!filePath) throw new Error('File path required.');
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      const content = await fs.promises.readFile(absolutePath, 'utf-8');
      return { success: true, filePath: absolutePath, content };
    } catch (err) {
      console.error(`[FileService] File read error:`, err.message);
      throw new Error(`FileService Error: ${err.message}`);
    }
  }
}
