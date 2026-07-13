import { Repository } from './interfaces';
import { RepositoryUnavailableError } from './errors';

export class RepositoryManager {
  private repos = new Map<string, Repository>();

  constructor() {
    this.seedDefaultRepository();
  }

  private seedDefaultRepository() {
    const defaultRepo: Repository = {
      id: 'repo_jarvis_os',
      path: 'd:/jarvis',
      provider: 'github',
      currentBranch: 'main',
      branches: ['main', 'feature/financial-os', 'feature/crm-engine'],
      commits: [
        { hash: 'a8b3c9f', author: 'Principal Architect', message: 'feat: initialize Financial OS core models', timestamp: Date.now() - 3600 * 24 * 1000 },
        { hash: 'e4f2d7a', author: 'Chief Architect', message: 'feat: implement CRM manager and scoring metrics', timestamp: Date.now() - 3600 * 12 * 1000 },
        { hash: '9b2c3d5', author: 'AI Core Assistant', message: 'chore: configure automation background workers', timestamp: Date.now() - 3600 * 1 * 1000 }
      ],
      remotes: {
        origin: 'https://github.com/jarvis-os/core.git'
      },
      isMock: true
    };
    this.repos.set(defaultRepo.id, defaultRepo);
  }

  public getRepository(repoId: string): Repository {
    const repo = this.repos.get(repoId);
    if (!repo) {
      throw new RepositoryUnavailableError(repoId, 'Git repository initialization failed.');
    }
    return repo;
  }

  public createBranch(repoId: string, branchName: string): Repository {
    const repo = this.getRepository(repoId);
    if (!repo.branches.includes(branchName)) {
      repo.branches.push(branchName);
    }
    repo.currentBranch = branchName;
    this.repos.set(repoId, repo);
    return repo;
  }

  public commitChanges(repoId: string, message: string, author = 'JARVIS Coding Agent'): Repository {
    const repo = this.getRepository(repoId);
    const hash = Math.random().toString(16).substr(2, 7);
    
    repo.commits.unshift({
      hash,
      author,
      message,
      timestamp: Date.now()
    });

    this.repos.set(repoId, repo);
    return repo;
  }

  public syncRemote(repoId: string, remoteName = 'origin'): Promise<boolean> {
    const repo = this.getRepository(repoId);
    if (!repo.remotes[remoteName]) {
      return Promise.reject(new Error(`Remote "${remoteName}" is not configured.`));
    }
    return new Promise((resolve) => setTimeout(() => resolve(true), 500));
  }
}

export const repositoryManager = new RepositoryManager();
export default repositoryManager;
