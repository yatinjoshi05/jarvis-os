import { BrowserTabStatus, SearchProviderType, DocumentType } from './types';

export interface BrowserTab {
  id: string;
  url: string;
  status: BrowserTabStatus;
  title: string;
  html: string;
  textContent: string;
  links: { text: string; href: string }[];
  forms: { action?: string; method?: string; inputs: { name: string; type: string }[] }[];
  cookies: Record<string, string>;
}

export interface BrowserSession {
  id: string;
  activeTabId?: string;
  tabs: Map<string, BrowserTab>;
  history: { url: string; timestamp: number }[];
  permissions: string[];
  cookies: Record<string, string>;
  createdAt: number;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  isMock?: boolean;
}

export interface SearchResult {
  query: string;
  provider: SearchProviderType;
  items: SearchResultItem[];
  timestamp: number;
  isMock?: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  metadata: Record<string, any>;
  sizeBytes: number;
}

// Future Compatibility Interfaces
export interface PlaywrightProvider {
  launchBrowser(): Promise<string>; // session id
  newPage(sessionId: string): Promise<string>; // tab id
  navigate(tabId: string, url: string): Promise<boolean>;
  screenshot(tabId: string): Promise<string>; // base64 or path
}

export interface PuppeteerProvider {
  connect(endpoint: string): Promise<string>;
  evaluate(tabId: string, script: string): Promise<any>;
}

export interface ChromeDevToolsProvider {
  sendCommand(method: string, params: any): Promise<any>;
  enableNetwork(): Promise<boolean>;
}
