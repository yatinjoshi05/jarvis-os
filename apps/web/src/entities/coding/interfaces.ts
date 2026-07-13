import { CodeActionType, RepositoryProviderType, TerminalCommandStatus } from './types';

export interface SourceFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  lineCount: number;
  sizeBytes: number;
}

export interface Project {
  rootPath: string;
  name: string;
  files: Map<string, SourceFile>;
  dependencies: string[];
  devDependencies: string[];
}

export interface Repository {
  id: string;
  path: string;
  provider: RepositoryProviderType;
  currentBranch: string;
  branches: string[];
  commits: { hash: string; author: string; message: string; timestamp: number }[];
  remotes: Record<string, string>;
  isMock?: boolean;
}

export interface CodeAction {
  id: string;
  type: CodeActionType;
  prompt: string;
  sourceCode?: string;
  resultDetails: {
    description: string;
    generatedCode?: string;
    diff?: string;
    reviewComments?: string[];
    performanceImprovementsCount?: number;
  };
  timestamp: number;
}

export interface TerminalCommand {
  id: string;
  command: string;
  cwd: string;
  status: TerminalCommandStatus;
  stdout: string;
  stderr: string;
  exitCode?: number;
  durationMs: number;
  timestamp: number;
  isMock?: boolean;
}

// Future Compatibility Interfaces
export interface GitHubApiProvider {
  createPullRequest(repoId: string, title: string, headBranch: string, baseBranch: string): Promise<number>;
  mergePullRequest(repoId: string, prNumber: number): Promise<boolean>;
}

export interface VSCodeExtensionSync {
  syncActiveEditor(): Promise<{ path: string; selectionStart: number; selectionEnd: number }>;
  insertText(text: string): Promise<boolean>;
}

export interface ClaudeCodeProvider {
  askArchitect(prompt: string, codebaseContext: any): Promise<string>;
}

export interface GeminiCliProvider {
  executePrompt(prompt: string, contextFiles: string[]): Promise<string>;
}

export interface OpenAICodexProvider {
  completeCode(prefix: string, suffix: string): Promise<string>;
}
