import { dashboardStore } from './store';
import { dashboardEventEmitter, DashboardEvents } from './events';

export class ThemeManager {
  public getTheme() {
    return dashboardStore.getState().theme;
  }

  public changeThemeMode(mode: 'light' | 'dark' | 'system') {
    const current = dashboardStore.getState().theme;
    const next = { ...current, mode };
    dashboardStore.setState({ theme: next });
    
    // Apply styling hook to root HTML element
    this.applyThemeToDOM(mode);

    dashboardEventEmitter.emit(DashboardEvents.THEME_CHANGED, next);
  }

  public changeAccentColor(color: string) {
    const current = dashboardStore.getState().theme;
    const next = { ...current, accentColor: color };
    dashboardStore.setState({ theme: next });

    // Apply custom styling hook to root document style
    document.documentElement.style.setProperty('--color-accent', color);

    dashboardEventEmitter.emit(DashboardEvents.THEME_CHANGED, next);
  }

  public applyThemeToDOM(mode: 'light' | 'dark' | 'system') {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  }

  public init() {
    const theme = this.getTheme();
    this.applyThemeToDOM(theme.mode);
    document.documentElement.style.setProperty('--color-accent', theme.accentColor);
  }
}

export const themeManager = new ThemeManager();
export default themeManager;
