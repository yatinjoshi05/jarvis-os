import { BrowserSession, BrowserTab, SearchResult } from './interfaces';
import { SearchProviderType } from './types';
import { BROWSER_CONFIG } from './config';
import { PermissionDeniedError } from './errors';
import { browserEventEmitter, BrowserEvents } from './events';
import { searchEngine } from './SearchEngine';
import { websiteAnalyzer } from './WebsiteAnalyzer';
import { serviceRegistry } from '../../shared/providers';

export class BrowserAgentManager {
  private sessions = new Map<string, BrowserSession>();
  private defaultSessionId = 'session_default';

  constructor() {
    this.createSession(this.defaultSessionId);
  }

  public createSession(id: string): BrowserSession {
    const session: BrowserSession = {
      id,
      tabs: new Map(),
      history: [],
      permissions: [...BROWSER_CONFIG.permissions],
      cookies: {},
      createdAt: Date.now()
    };
    this.sessions.set(id, session);
    return session;
  }

  public getSession(sessionId = this.defaultSessionId): BrowserSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }
    return session;
  }

  // ─── PUBLIC BROWSING API ────────────────────────────────────

  public async openPage(url: string, sessionId = this.defaultSessionId): Promise<BrowserTab> {
    const session = this.getSession(sessionId);

    const isAllowed = session.permissions.some((p) => url.startsWith(p)) || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
    if (!isAllowed) {
      throw new PermissionDeniedError(`URL "${url}" is blocked by configuration sandbox.`);
    }

    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const mockContent = BROWSER_CONFIG.mockWebpages[url] || {
      title: `Simulated: ${url}`,
      html: `<html><body><h1>Hello from ${url}</h1><p>This is a simulated webpage content.</p></body></html>`,
      textContent: `Hello from ${url}. This is simulated webpage text content.`,
      links: []
    };

    const newTab: BrowserTab = {
      id: tabId,
      url,
      status: 'complete',
      title: mockContent.title,
      html: mockContent.html,
      textContent: mockContent.textContent,
      links: mockContent.links,
      forms: [],
      cookies: {}
    };

    session.tabs.set(tabId, newTab);
    session.activeTabId = tabId;
    session.history.push({ url, timestamp: Date.now() });

    if (session.history.length > BROWSER_CONFIG.maxHistoryEntries) {
      session.history.shift();
    }

    this.sessions.set(sessionId, session);
    
    browserEventEmitter.emit(BrowserEvents.PAGE_OPENED, { sessionId, tabId, url });

    return newTab;
  }

  public async analyzePage(url: string, sessionId = this.defaultSessionId): Promise<any> {
    const session = this.getSession(sessionId);
    let activeTab = Array.from(session.tabs.values()).find((t) => t.url === url);
    
    if (!activeTab) {
      activeTab = await this.openPage(url, sessionId);
    }

    return websiteAnalyzer.analyzePage(activeTab.html, url);
  }

  public async searchWeb(query: string, provider?: SearchProviderType): Promise<SearchResult> {
    return searchEngine.search(query, provider);
  }

  public closePage(tabId: string, sessionId = this.defaultSessionId): boolean {
    const session = this.getSession(sessionId);
    const success = session.tabs.delete(tabId);
    if (success) {
      if (session.activeTabId === tabId) {
        session.activeTabId = Array.from(session.tabs.keys())[0];
      }
      this.sessions.set(sessionId, session);
      browserEventEmitter.emit(BrowserEvents.PAGE_CLOSED, { sessionId, tabId });
    }
    return success;
  }
}

export const browserAgentManager = new BrowserAgentManager();
serviceRegistry.register('browserAgentManager', browserAgentManager);
export default browserAgentManager;
