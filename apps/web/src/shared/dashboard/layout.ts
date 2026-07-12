import { PanelVisibility, LayoutConfig } from './types';
import { DASHBOARD_CONFIG } from './config';

class LayoutManager {
  private panels: PanelVisibility = { ...DASHBOARD_CONFIG.defaultPanels };
  private splitView = false;

  public getLayoutConfig(): LayoutConfig {
    return {
      panels: { ...this.panels },
      splitView: this.splitView,
      columnsCount: this.getOptimalColumnsCount()
    };
  }

  public setPanelVisibility(panel: keyof PanelVisibility, visible: boolean) {
    this.panels[panel] = visible;
  }

  public setSplitView(enabled: boolean) {
    this.splitView = enabled;
  }

  public getOptimalColumnsCount(): number {
    const width = window.innerWidth;
    if (width < 640) return 1; // mobile
    if (width < 1024) return 2; // tablet
    return 3; // desktop
  }
}

export const layoutManager = new LayoutManager();
export default layoutManager;
