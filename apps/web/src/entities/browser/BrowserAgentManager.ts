import { BrowserSession, BrowserTab, SearchResult } from './interfaces';
import { SearchProviderType } from './types';
import { BROWSER_CONFIG } from './config';
import { PermissionDeniedError } from './errors';
import { browserEventEmitter, BrowserEvents } from './events';
import { searchEngine } from './SearchEngine';
import { websiteAnalyzer } from './WebsiteAnalyzer';
import { serviceRegistry } from '../../shared/providers';
import { aiRouter } from '../../shared/ai/AIRouter';
import { fileManager } from '../coding/fileManager';

export function isSSRFUnsafe(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();

    // Block localhost and loopbacks
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    // Private IPv4 range checks
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipPattern);
    if (match) {
      const [, octet1, octet2] = match.map(Number);
      // 10.0.0.0 - 10.255.255.255
      if (octet1 === 10) return true;
      // 172.16.0.0 - 172.31.255.255
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
      // 192.168.0.0 - 192.168.255.255
      if (octet1 === 192 && octet2 === 168) return true;
      // 169.254.0.0 - 169.254.255.255 (AWS/Cloud link-local metadata)
      if (octet1 === 169 && octet2 === 254) return true;
      // 127.0.0.0 - 127.255.255.255
      if (octet1 === 127) return true;
      // 0.0.0.0 - 0.255.255.255
      if (octet1 === 0) return true;
    }

    return false;
  } catch (_) {
    return true; // If URL is invalid, block it as a precaution
  }
}

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
    if (isSSRFUnsafe(url)) {
      throw new PermissionDeniedError(`Access to URL "${url}" is blocked due to SSRF safety policies (private IP / localhost).`);
    }

    const session = this.getSession(sessionId);

    const isAllowed = session.permissions.some((p) => url.startsWith(p)) || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
    if (!isAllowed) {
      throw new PermissionDeniedError(`URL "${url}" is blocked by configuration sandbox.`);
    }

    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    let pageContent = BROWSER_CONFIG.mockWebpages[url];

    // Attempt real HTTP fetch client-side first
    if (!pageContent && (url.startsWith('http://') || url.startsWith('https://'))) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(BROWSER_CONFIG.navigationTimeoutMs) });
        if (response.ok) {
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const title = doc.title || `Parsed: ${url}`;
          const textContent = doc.body ? doc.body.textContent || '' : '';
          const links: { text: string; href: string }[] = [];
          
          doc.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href) {
              links.push({ text: a.textContent || '', href });
            }
          });

          pageContent = {
            title,
            html,
            textContent: textContent.trim(),
            links: links.slice(0, 100)
          };
        }
      } catch (e) {
        console.warn(`[BrowserAgentManager] Real fetch for URL "${url}" failed due to CORS or Network. Falling back to simulator.`, e);
      }
    }

    if (!pageContent) {
      pageContent = BROWSER_CONFIG.mockWebpages[url] || {
        title: `Simulated: ${url}`,
        html: `<html><body><h1>Hello from ${url}</h1><p>This is simulated webpage content.</p></body></html>`,
        textContent: `Hello from ${url}. This is simulated webpage text content.`,
        links: []
      };
    }

    const newTab: BrowserTab = {
      id: tabId,
      url,
      status: 'complete',
      title: pageContent.title,
      html: pageContent.html,
      textContent: pageContent.textContent,
      links: pageContent.links,
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

  public async summarizePage(url: string, sessionId = this.defaultSessionId): Promise<string> {
    const session = this.getSession(sessionId);
    let activeTab = Array.from(session.tabs.values()).find((t) => t.url === url);
    
    if (!activeTab) {
      activeTab = await this.openPage(url, sessionId);
    }

    const textToSummarize = activeTab.textContent || activeTab.html;
    const prompt = `Please summarize the key information and main points of the following webpage content in a structured paragraph:\n\n${textToSummarize.slice(0, 8000)}`;

    return await aiRouter.generateResponse(prompt);
  }

  public async downloadFile(url: string, destinationPath: string, sessionId = this.defaultSessionId): Promise<string> {
    if (isSSRFUnsafe(url)) {
      throw new PermissionDeniedError(`Access to URL "${url}" is blocked due to SSRF safety policies.`);
    }

    // Force destination to be in the downloads folder inside the allowed sandbox
    const normalizedDest = destinationPath.replace(/\\/g, '/');
    const isSandboxPath = normalizedDest.startsWith('downloads/') || normalizedDest.startsWith('./downloads/') || normalizedDest.startsWith('d:/jarvis/downloads/');
    if (!isSandboxPath) {
      throw new PermissionDeniedError(`Download destination "${destinationPath}" must reside inside the sandbox 'downloads/' directory.`);
    }

    const session = this.getSession(sessionId);
    let activeTab = Array.from(session.tabs.values()).find((t) => t.url === url);
    if (!activeTab) {
      activeTab = await this.openPage(url, sessionId);
    }

    const content = activeTab.textContent || activeTab.html;

    // Enforce size limit (max 5MB to prevent disk-fill abuse)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (content.length > MAX_SIZE) {
      throw new Error(`File size exceeds safety limit of 5MB.`);
    }

    fileManager.saveFile(destinationPath, content);
    
    browserEventEmitter.emit(BrowserEvents.DOWNLOAD_COMPLETED, { url, path: destinationPath, size: content.length });
    return destinationPath;
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
