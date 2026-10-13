import { useBrowserStore, PreviewMode, ProjectType } from '../model/useBrowserStore';
import { browserLogger } from './BrowserLogger';

export class BrowserEngineService {
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isChecking: boolean = false;

  public initialize() {
    this.startServerHeartbeat();
  }

  public destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Automatically detect project type and mode from URL or file name
   */
  public detectProject(urlOrPath: string): { mode: PreviewMode; projectType: ProjectType } {
    return useBrowserStore.getState().detectProject(urlOrPath);
  }

  /**
   * Open a target website or localhost URL
   */
  public openUrl(url: string) {
    const startTime = performance.now();
    useBrowserStore.getState().openUrl(url);
    this.checkUrlHealth(url);
    const duration = Math.round(performance.now() - startTime);
    browserLogger.log('preview_opened', 'SUCCESS', duration, { url, type: 'url' });
  }

  /**
   * Open a generated project or HTML code string preview
   */
  public openProject(project: { name?: string; url?: string; htmlContent?: string; type?: ProjectType }) {
    const startTime = performance.now();
    useBrowserStore.getState().openProject(project);
    if (project.url && !project.htmlContent) {
      this.checkUrlHealth(project.url);
    }
    const duration = Math.round(performance.now() - startTime);
    browserLogger.log('preview_opened', 'SUCCESS', duration, { name: project.name, url: project.url, type: 'project' });
  }

  /**
   * Trigger sub-500ms live reload preserving browser state
   */
  public triggerLiveReload() {
    const startTime = performance.now();
    const store = useBrowserStore.getState();
    if (store.liveReload) {
      store.reloadPreview();
      const duration = Math.round(performance.now() - startTime);
      browserLogger.log('reload_triggered', 'SUCCESS', duration, { url: store.activeUrl });
    }
  }

  /**
   * Check if target localhost server or URL is reachable
   */
  public async checkUrlHealth(url: string) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);

      const store = useBrowserStore.getState();
      if (store.previewStatus === 'offline' || store.previewStatus === 'loading') {
        store.setPreviewStatus('ready');
      }
    } catch (err: any) {
      const store = useBrowserStore.getState();
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        store.setPreviewStatus('offline', `Waiting for server at ${url}...`);
        browserLogger.log('preview_failed', 'WARNING', 0, { url, error: 'Server Offline' });
      }
    }
  }

  /**
   * Start recurring heartbeat loop for active localhost servers
   */
  private startServerHeartbeat() {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.isChecking) return;
      this.isChecking = true;

      const store = useBrowserStore.getState();
      const currentUrl = store.activeUrl;

      if (currentUrl && (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1'))) {
        this.checkUrlHealth(currentUrl).finally(() => {
          this.isChecking = false;
        });
      } else {
        this.isChecking = false;
      }
    }, 4000);
  }
}

export const browserEngine = new BrowserEngineService();
