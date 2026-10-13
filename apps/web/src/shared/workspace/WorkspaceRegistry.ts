import type { WorkspaceDefinition, WorkspaceId, WorkspacePermission } from './types';

/** Registry is intentionally UI-free: a module declares its contract before rendering. */
class WorkspaceRegistry {
  private definitions = new Map<WorkspaceId, WorkspaceDefinition>();

  register(definition: WorkspaceDefinition): () => void {
    if (this.definitions.has(definition.id)) throw new Error(`Workspace "${definition.id}" is already registered.`);
    this.definitions.set(definition.id, { ...definition, permissions: definition.permissions ?? [], components: definition.components ?? [] });
    return () => this.definitions.delete(definition.id);
  }
  get(id: WorkspaceId): WorkspaceDefinition | undefined { return this.definitions.get(id); }
  getByRoute(path: string): WorkspaceDefinition | undefined { return [...this.definitions.values()].find(item => item.route === path); }
  list(): WorkspaceDefinition[] { return [...this.definitions.values()]; }
  can(id: WorkspaceId, permission: WorkspacePermission): boolean { return this.get(id)?.permissions?.includes(permission) ?? false; }
}

export const workspaceRegistry = new WorkspaceRegistry();
