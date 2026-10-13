import { workspaceRuntimeStore } from './WorkspaceRuntimeStore';
import type { WorkspaceId } from './types';

/** Records restorable context without controlling React routes or changing current navigation UI. */
class WorkspaceNavigation {
  open(workspaceId: WorkspaceId, path: string, scrollTop?: number): void {
    const existing = workspaceRuntimeStore.get(workspaceId);
    workspaceRuntimeStore.setNavigation(workspaceId, path, scrollTop);
    workspaceRuntimeStore.log(workspaceId, existing.navigation.path ? 'workspace.restored' : 'workspace.opened', existing.navigation.path ? 'Workspace context restored' : 'Workspace opened', { path });
  }
  close(workspaceId: WorkspaceId): void { workspaceRuntimeStore.log(workspaceId, 'workspace.closed', 'Workspace closed'); }
  restore(workspaceId: WorkspaceId) { return workspaceRuntimeStore.get(workspaceId).navigation; }
}

export const workspaceNavigation = new WorkspaceNavigation();
