import { Widget } from './interfaces';
import { widgetManager } from './widget';
import { workspaceManager } from './workspace';
import { notificationManager } from './notification';
import { commandBarManager } from './command';
import { themeManager } from './theme';
import { sidebarManager } from './sidebar';
import { dockManager } from './dock';
import { layoutManager } from './layout';
import { statusManager } from './status';
import { searchManager } from './search';
import { navigationManager } from './navigation';

export class DashboardManager {
  // Expose sub-managers for modular access
  public widgets = widgetManager;
  public workspaces = workspaceManager;
  public notifications = notificationManager;
  public commands = commandBarManager;
  public themes = themeManager;
  public sidebars = sidebarManager;
  public docks = dockManager;
  public layouts = layoutManager;
  public statuses = statusManager;
  public searches = searchManager;
  public navigations = navigationManager;

  constructor() {
    this.init();
  }

  private init() {
    // Bootstrap configurations
    this.themes.init();
  }

  // Coordinator Public APIs
  public openWidget(widgetId: string) {
    this.widgets.setWidgetVisibility(widgetId, true);
  }

  public closeWidget(widgetId: string) {
    this.widgets.setWidgetVisibility(widgetId, false);
  }

  public switchWorkspace(workspaceId: string) {
    this.workspaces.switchWorkspace(workspaceId);
  }

  public showNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    duration?: number
  ): string {
    return this.notifications.showNotification(type, title, message, duration);
  }

  public async executeCommand(commandText: string): Promise<void> {
    await this.commands.executeCommand(commandText);
  }

  public changeTheme(mode: 'light' | 'dark' | 'system') {
    this.themes.changeThemeMode(mode);
  }

  public registerWidget(widget: Widget) {
    this.widgets.registerWidget(widget);
  }

  public unregisterWidget(widgetId: string) {
    this.widgets.unregisterWidget(widgetId);
  }
}

export const dashboardManager = new DashboardManager();
export default dashboardManager;
