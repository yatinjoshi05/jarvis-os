import { SourceFile } from './interfaces';
import { CODING_CONFIG } from './config';
import { FileMissingError } from './errors';
import { PermissionDeniedError } from '../browser/errors';
import { browserEventEmitter, BrowserEvents } from '../browser/events';

export class FileManager {
  private files = new Map<string, SourceFile>();
  private recentFilesList: string[] = [];

  constructor() {
    this.seedDefaultFiles();
  }

  private addToRecent(path: string) {
    this.recentFilesList = [path, ...this.recentFilesList.filter((p) => p !== path)].slice(0, 5);
  }

  public getRecentFiles(): string[] {
    return this.recentFilesList;
  }

  private seedDefaultFiles() {
    Object.entries(CODING_CONFIG.mockProjectFiles).forEach(([path, file]) => {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const extension = name.split('.').pop() || '';
      
      this.files.set(path, {
        path,
        name,
        extension,
        content: file.content,
        lineCount: file.content.split('\n').length,
        sizeBytes: file.content.length
      });
    });
  }

  private verifySandbox(filePath: string) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const isSandboxPath = CODING_CONFIG.allowedSandboxDirectories.some(
      (dir) => normalizedPath.startsWith(dir) || normalizedPath.startsWith(dir.replace('d:', ''))
    );
    const isRelative = !normalizedPath.includes(':') && !normalizedPath.startsWith('/');
    
    if (!isSandboxPath && !isRelative) {
      throw new PermissionDeniedError(`Path "${filePath}" is outside the allowed sandbox environment.`);
    }
  }

  public openFile(path: string): SourceFile {
    this.verifySandbox(path);
    const file = this.files.get(path);
    if (!file) {
      throw new FileMissingError(path);
    }

    this.addToRecent(path);
    browserEventEmitter.emit(BrowserEvents.FILE_OPENED, { path });
    return file;
  }

  public saveFile(path: string, content: string): SourceFile {
    this.verifySandbox(path);
    const parts = path.replace(/\\/g, '/').split('/');
    const name = parts[parts.length - 1];
    const extension = name.split('.').pop() || '';

    const newFile: SourceFile = {
      path,
      name,
      extension,
      content,
      lineCount: content.split('\n').length,
      sizeBytes: content.length
    };

    this.files.set(path, newFile);
    this.addToRecent(path);
    
    browserEventEmitter.emit(BrowserEvents.FILE_UPDATED, { path });
    return newFile;
  }

  public deleteFile(path: string): boolean {
    this.verifySandbox(path);
    if (!this.files.has(path)) {
      throw new FileMissingError(path);
    }
    return this.files.delete(path);
  }

  public moveFile(source: string, destination: string): boolean {
    this.verifySandbox(source);
    this.verifySandbox(destination);
    
    const file = this.files.get(source);
    if (!file) {
      throw new FileMissingError(source);
    }

    this.files.delete(source);
    this.saveFile(destination, file.content);
    return true;
  }

  public copyFile(source: string, destination: string): boolean {
    this.verifySandbox(source);
    this.verifySandbox(destination);

    const file = this.files.get(source);
    if (!file) {
      throw new FileMissingError(source);
    }

    this.saveFile(destination, file.content);
    return true;
  }

  public getFilesList(): SourceFile[] {
    return Array.from(this.files.values());
  }
}

export const fileManager = new FileManager();
export default fileManager;
