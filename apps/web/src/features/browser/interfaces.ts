/**
 * Representation of a virtual browser tab.
 */
export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

/**
 * Item in search browsing logs.
 */
export interface BrowserHistoryItem {
  url: string;
  title: string;
  visitedAt: number;
}
