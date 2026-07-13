export const CODING_CONFIG = {
  defaultWorkspaceRoot: 'd:/jarvis',
  excludeGlobs: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**'
  ],
  allowedSandboxDirectories: [
    'd:/jarvis/sandbox',
    'd:/jarvis/apps/web/src'
  ],
  
  allowedTerminalCommands: [
    'git status',
    'git diff',
    'git log',
    'git branch',
    'npm run build',
    'npm test',
    'pnpm build:web',
    'tsc --noEmit'
  ],

  // Mock project file database for sandbox and repository analysis simulation
  mockProjectFiles: {
    'package.json': {
      content: JSON.stringify({
        name: 'jarvis-os',
        version: '1.0.0',
        dependencies: {
          typescript: '^5.1.0',
          vite: '^5.4.0',
          react: '^18.2.0'
        },
        devDependencies: {
          eslint: '^8.45.0',
          vitest: '^0.33.0'
        }
      }, null, 2)
    },
    'src/index.ts': {
      content: `export function initializeOS() {\n  console.log("JARVIS OS Initializing...");\n  return true;\n}`
    },
    'src/entities/financial/FinancialManager.ts': {
      content: `export class FinancialManager {\n  public getProfile(id: string) {\n    return { id, netWorth: 150000 };\n  }\n}`
    }
  } as Record<string, { content: string }>
};

export default CODING_CONFIG;
