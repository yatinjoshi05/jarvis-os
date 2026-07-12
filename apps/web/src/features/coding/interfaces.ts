import { ProgrammingLanguage } from './types';

/**
 * Code snippet structure.
 */
export interface CodeSnippet {
  filename: string;
  language: ProgrammingLanguage;
  content: string;
}

/**
 * Project workspace path metadata.
 */
export interface ProjectWorkspace {
  rootPath: string;
  files: string[];
}
