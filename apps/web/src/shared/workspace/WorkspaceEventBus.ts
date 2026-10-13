import type { WorkspaceEvent, WorkspaceEventType } from './types';

type Listener = (event: WorkspaceEvent) => void;

/** In-process, typed-by-convention event channel for cross-workspace coordination. */
class WorkspaceEventBus {
  private listeners = new Map<WorkspaceEventType | '*', Set<Listener>>();

  emit(event: WorkspaceEvent): void {
    for (const listener of [...(this.listeners.get(event.type) ?? []), ...(this.listeners.get('*') ?? [])]) {
      listener(event);
    }
  }

  subscribe(type: WorkspaceEventType | '*', listener: Listener): () => void {
    const group = this.listeners.get(type) ?? new Set<Listener>();
    group.add(listener);
    this.listeners.set(type, group);
    return () => group.delete(listener);
  }
}

export const workspaceEventBus = new WorkspaceEventBus();
