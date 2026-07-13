import { SearchResult, SearchResultItem } from './interfaces';
import { SearchProviderType } from './types';
import { SearchFailureError } from './errors';
import { BROWSER_CONFIG } from './config';
import { browserEventEmitter, BrowserEvents } from './events';

export class SearchEngine {
  private history: SearchResult[] = [];

  public async search(query: string, provider: SearchProviderType = BROWSER_CONFIG.defaultSearchProvider): Promise<SearchResult> {
    browserEventEmitter.emit(BrowserEvents.SEARCH_STARTED, { query, provider });
    
    if (!query || query.trim() === '') {
      throw new SearchFailureError(query, 'Query is empty.');
    }

    try {
      const mockItems: SearchResultItem[] = [
        {
          title: `How to build a coding agent for ${query}`,
          url: `https://stackoverflow.com/questions/ai-agent-build`,
          snippet: `This discussion covers the best practices on how to set up an execution pipeline for ${query} using TypeScript.`,
          isMock: true
        },
        {
          title: `Comprehensive Guide: ${query}`,
          url: `https://github.com/developer-guides/${query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `A curated list of tutorials, papers, and repository tools covering the latest strategies for ${query}.`,
          isMock: true
        },
        {
          title: `${query} Documentation Reference`,
          url: `https://wikipedia.org/wiki/${encodeURIComponent(query)}`,
          snippet: `The free encyclopedia entry for ${query}, detailing historical context, implementation layers, and architectures.`,
          isMock: true
        }
      ];

      const result: SearchResult = {
        query,
        provider,
        items: mockItems,
        timestamp: Date.now(),
        isMock: true
      };

      this.history.push(result);
      if (this.history.length > 50) this.history.shift();

      browserEventEmitter.emit(BrowserEvents.SEARCH_COMPLETED, result);
      return result;
    } catch (e: any) {
      throw new SearchFailureError(query, e.message || String(e));
    }
  }

  public getHistory(): SearchResult[] {
    return this.history;
  }
}

export const searchEngine = new SearchEngine();
export default searchEngine;
