/**
 * SearchService — Public API for Web Search, Local Search & Market Data Quotes
 */
export class SearchService {
  /**
   * Perform external web search
   */
  static async searchWeb(query) {
    try {
      if (!query || !query.trim()) throw new Error('Search query required');
      console.log(`[SearchService] Executing web search query: "${query}"`);
      return {
        query,
        results: [`Search result placeholder for query: ${query}`],
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error(`[SearchService] Web search error:`, err.message);
      return { query, results: [], error: err.message };
    }
  }

  /**
   * Retrieve financial market quote data
   */
  static async getMarketQuote(symbol = 'AAPL') {
    try {
      const apiKey = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) throw new Error('Finnhub API key missing');
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { symbol: symbol.toUpperCase(), price: data.c, high: data.h, low: data.l, timestamp: Date.now() };
    } catch (err) {
      console.warn(`[SearchService] Quote fetch error:`, err.message);
      return { symbol, price: null, error: err.message };
    }
  }
}
