import { SidebarItem } from './interfaces';
import { dashboardStore } from './store';
import { dashboardEventEmitter, DashboardEvents } from './events';

class SidebarManager {
  public getSidebarItems(): SidebarItem[] {
    return dashboardStore.getState().sidebarItems;
  }

  public isCollapsed(): boolean {
    return dashboardStore.getState().activeSidebarCollapsed;
  }

  public setCollapsed(collapsed: boolean) {
    dashboardStore.setState({ activeSidebarCollapsed: collapsed });
    
    if (collapsed) {
      dashboardEventEmitter.emit(DashboardEvents.SIDEBAR_COLLAPSED);
    } else {
      dashboardEventEmitter.emit(DashboardEvents.SIDEBAR_EXPANDED);
    }
  }

  public addSidebarItem(item: SidebarItem) {
    const items = this.getSidebarItems();
    if (items.find((i) => i.id === item.id)) {
      throw new Error(`Sidebar item with ID "${item.id}" already exists.`);
    }

    dashboardStore.setState({ sidebarItems: [...items, item] });
  }

  public removeSidebarItem(itemId: string) {
    const items = this.getSidebarItems();
    const updated = items.filter((i) => i.id !== itemId);
    dashboardStore.setState({ sidebarItems: updated });
  }
}

export const sidebarManager = new SidebarManager();
export default sidebarManager;
