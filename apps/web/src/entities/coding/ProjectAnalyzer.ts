import { Project } from './interfaces';
import { fileManager } from './fileManager';
import { browserEventEmitter, BrowserEvents } from '../browser/events';

export class ProjectAnalyzer {
  /**
   * Scans workspace directories, gathers package.json dependencies, and triggers the analyzed event.
   */
  public analyzeProject(rootPath = 'd:/jarvis'): Project {
    const filesList = fileManager.getFilesList();
    const filesMap = new Map();
    
    let dependencies: string[] = [];
    let devDependencies: string[] = [];

    filesList.forEach((file) => {
      filesMap.set(file.path, file);
      
      if (file.path === 'package.json') {
        try {
          const parsed = JSON.parse(file.content);
          if (parsed.dependencies) {
            dependencies = Object.keys(parsed.dependencies);
          }
          if (parsed.devDependencies) {
            devDependencies = Object.keys(parsed.devDependencies);
          }
        } catch (_) { /* ignore */ }
      }
    });

    const project: Project = {
      rootPath,
      name: 'jarvis-os-core',
      files: filesMap,
      dependencies,
      devDependencies
    };

    browserEventEmitter.emit(BrowserEvents.PROJECT_ANALYZED, { rootPath, filesCount: filesList.length });
    return project;
  }
}

export const projectAnalyzer = new ProjectAnalyzer();
export default projectAnalyzer;
