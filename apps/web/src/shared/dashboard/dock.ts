import { DockItem } from './interfaces';
import { dashboardStore } from './store';

class DockManager {
  public getDockItems(): DockItem[] {
    return dashboardStore.getState().dockItems;
  }

  public addDockItem(item: DockItem) {
    const items = this.getDockItems();
    if (items.find((i) => i.id === item.id)) {
      throw new Error(`Dock item with ID "${item.id}" already exists.`);
    }

    dashboardStore.setState({ dockItems: [...items, item] });
  }

  public removeDockItem(itemId: string) {
    const items = this.getDockItems();
    const updated = items.filter((i) => i.id !== itemId);
    dashboardStore.setState({ dockItems: updated });
  }

  public updateDockOrder(itemId: string, order: number) {
    const items = this.getDockItems();
    const target = items.find((i) => i.id === itemId);
    if (target) {
      target.order = order;
      const sorted = [...items].sort((a, b) => a.order - b.order);
      dashboardStore.setState({ dockItems: sorted });
    }
  }
}

export const dockManager = new DockManager();
export default dockManager;
