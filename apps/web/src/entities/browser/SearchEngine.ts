import { SearchResult, SearchResultItem } from './interfaces';
import { SearchProviderType } from './types';
import { SearchFailureError } from './errors';
import { BROWSER_CONFIG } from './config';
import { browserEventEmitter, BrowserEvents } from './events';

export class SearchEngine {
  private history: SearchResult[] = [];

  public async search(
    query: string,
    provider: SearchProviderType = BROWSER_CONFIG.defaultSearchProvider
  ): Promise<SearchResult> {
    browserEventEmitter.emit(BrowserEvents.SEARCH_STARTED, { query, provider });

    if (!query || query.trim() === '') {
      throw new SearchFailureError(query, 'Query is empty.');
    }

    try {
      // DuckDuckGo Instant Answer API — free, no API key required
      const encoded = encodeURIComponent(query.trim());
      const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API responded with status ${response.status}`);
      }

      const data = await response.json();
      const items: SearchResultItem[] = [];

      // Abstract — direct factual answer (e.g. Wikipedia summary)
      if (data.AbstractText && data.AbstractURL) {
        items.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: data.AbstractText,
          isMock: false
        });
      }

      // Answer block (short direct answer)
      if (data.Answer && data.AnswerType) {
        items.push({
          title: `${data.AnswerType}: ${query}`,
          url: `https://duckduckgo.com/?q=${encoded}`,
          snippet: String(data.Answer),
          isMock: false
        });
      }

      // Related topics — organic results
      const addTopic = (topic: any) => {
        if (items.length >= 8) return;
        if (topic.FirstURL && topic.Text) {
          items.push({
            title: topic.Text.split(' - ')[0]?.slice(0, 80) || topic.Text.slice(0, 80),
            url: topic.FirstURL,
            snippet: topic.Text,
            isMock: false
          });
        }
      };

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (items.length >= 8) break;
          if (topic.Topics && Array.isArray(topic.Topics)) {
            topic.Topics.forEach(addTopic);
          } else {
            addTopic(topic);
          }
        }
      }

      // Fallback: at least show a DuckDuckGo search link
      if (items.length === 0) {
        items.push({
          title: `Search DuckDuckGo for "${query}"`,
          url: `https://duckduckgo.com/?q=${encoded}`,
          snippet: `Click to view full search results for "${query}" on DuckDuckGo.`,
          isMock: false
        });
      }

      const result: SearchResult = {
        query,
        provider,
        items,
        timestamp: Date.now(),
        isMock: false
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
