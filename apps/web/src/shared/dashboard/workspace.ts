import { Workspace } from './interfaces';
import { dashboardStore } from './store';
import { dashboardEventEmitter, DashboardEvents } from './events';
import { InvalidWorkspaceError } from './errors';

class WorkspaceManager {
  public getWorkspaces(): Workspace[] {
    return dashboardStore.getState().workspaces;
  }

  public getActiveWorkspaceId(): string {
    return dashboardStore.getState().activeWorkspaceId;
  }

  public getActiveWorkspace(): Workspace | null {
    const list = this.getWorkspaces();
    const activeId = this.getActiveWorkspaceId();
    return list.find((w) => w.id === activeId) || null;
  }

  public createWorkspace(name: string, category: string, widgets: string[] = []): Workspace {
    const workspaces = this.getWorkspaces();
    const id = `work_${Math.random().toString(36).substr(2, 9)}${Date.now()}`;

    const newWorkspace: Workspace = {
      id,
      name,
      category,
      isActive: false,
      widgets,
      createdAt: Date.now()
    };

    dashboardStore.setState({ workspaces: [...workspaces, newWorkspace] });
    return newWorkspace;
  }

  public switchWorkspace(workspaceId: string) {
    const workspaces = this.getWorkspaces();
    const target = workspaces.find((w) => w.id === workspaceId);
    if (!target) {
      throw new InvalidWorkspaceError(workspaceId);
    }

    // Toggle active flag on list
    const updated = workspaces.map((w) => ({
      ...w,
      isActive: w.id === workspaceId
    }));

    dashboardStore.setState({
      workspaces: updated,
      activeWorkspaceId: workspaceId
    });

    dashboardEventEmitter.emit(DashboardEvents.WORKSPACE_CHANGED, target);
  }
}

export const workspaceManager = new WorkspaceManager();
export default workspaceManager;
