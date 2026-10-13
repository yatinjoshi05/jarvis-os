/**
 * WindowService — Public API for Active Window Context & Desktop Window Perception
 */
export class WindowService {
  constructor() {
    this.activeWindow = { title: 'Desktop Shell', appName: 'JARVIS OS', updatedAt: Date.now() };
  }

  /**
   * Retrieve active window state snapshot
   */
  async getActiveWindow() {
    return this.activeWindow;
  }

  /**
   * Update active window state title and application name
   */
  async updateActiveWindow(title, appName) {
    this.activeWindow = {
      title: title || this.activeWindow.title,
      appName: appName || this.activeWindow.appName,
      updatedAt: Date.now(),
    };
    return { success: true, activeWindow: this.activeWindow };
  }
}

export const windowService = new WindowService();
