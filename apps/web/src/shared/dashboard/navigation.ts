class NavigationManager {
  private history: string[] = ['/'];
  private currentIndex = 0;

  public getHistory(): string[] {
    return [...this.history];
  }

  public getCurrentPath(): string {
    return this.history[this.currentIndex] || '/';
  }

  public navigateTo(path: string) {
    // Truncate forward history if navigating from back state
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    this.history.push(path);
    this.currentIndex = this.history.length - 1;
  }

  public goBack(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentPath();
    }
    return null;
  }

  public goForward(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.getCurrentPath();
    }
    return null;
  }

  public getBreadcrumbs(): string[] {
    const current = this.getCurrentPath();
    if (current === '/') return ['Home'];
    
    const segments = current.split('/').filter(Boolean);
    return ['Home', ...segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1))];
  }
}

export const navigationManager = new NavigationManager();
export default navigationManager;
