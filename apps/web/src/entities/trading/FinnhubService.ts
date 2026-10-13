export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface StockCandle {
  timestamps: number[];
  closes: number[];
  highs: number[];
  lows: number[];
  opens: number[];
}

export interface MarketNewsArticle {
  id: number | string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  image?: string;
}

class FinnhubService {
  private getApiKey(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('jarvis_finnhub_api_key') || null;
    }
    return null;
  }

  public setApiKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('jarvis_finnhub_api_key', key.trim());
    }
  }

  public hasCustomApiKey(): boolean {
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem('jarvis_finnhub_api_key');
    }
    return false;
  }

  /**
   * Fetch real-time stock quote (Finnhub with Yahoo Finance fallback)
   */
  private async safeFetchJson(targetUrl: string, timeoutMs = 5000): Promise<any> {
    // 1. Direct fetch (works in Node.js or if target has CORS headers)
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    // 2. Local Express Proxy (/api/market/proxy?url=...)
    try {
      const proxyUrl = `/api/market/proxy?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    // 3. Public CORS Proxy Fallback
    try {
      const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(corsUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    return null;
  }

  /**
   * Fetch real-time stock quote (Finnhub with Yahoo Finance fallback)
   * Returns null if no real market data source succeeds. Never returns synthetic data.
   */
  public async fetchQuote(symbol: string): Promise<StockQuote | null> {
    const sym = symbol.toUpperCase().trim();
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${apiKey}`;
        const data = await this.safeFetchJson(url, 4000);
        if (data && data.c > 0) {
          return {
            symbol: sym,
            currentPrice: data.c,
            change: data.d,
            percentChange: data.dp,
            high: data.h,
            low: data.l,
            open: data.o,
            previousClose: data.pc,
            timestamp: Date.now()
          };
        }
      } catch (_) {}
    }

    const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1m`;
    const json = await this.safeFetchJson(fallbackUrl, 5000);
    const result = json?.chart?.result?.[0];

    if (result) {
      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 0;
      const previousClose = meta.chartPreviousClose || currentPrice;
      if (currentPrice > 0) {
        const change = currentPrice - previousClose;
        const percentChange = previousClose > 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol: sym,
          currentPrice,
          change,
          percentChange,
          high: meta.regularMarketDayHigh || currentPrice,
          low: meta.regularMarketDayLow || currentPrice,
          open: meta.regularMarketOpen || currentPrice,
          previousClose,
          timestamp: Date.now()
        };
      }
    }

    // No synthetic fallback. Return null when real data is unavailable.
    return null;
  }

  /**
   * Fetch historical candles for price charting (Finnhub with Proxy & Fallback)
   * Returns null if no real data source succeeds. Never returns synthetic candles.
   */
  public async fetchCandles(symbol: string, days = 30): Promise<StockCandle | null> {
    const sym = symbol.toUpperCase().trim();
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (days * 24 * 60 * 60);
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(sym)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

        const data = await this.safeFetchJson(url, 4000);
        if (data && data.s === 'ok' && data.c && data.c.length > 0) {
          return {
            timestamps: data.t || [],
            closes: data.c || [],
            highs: data.h || [],
            lows: data.l || [],
            opens: data.o || []
          };
        }
      } catch (_) {}
    }

    const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`;
    const json = await this.safeFetchJson(fallbackUrl, 6000);
    const result = json?.chart?.result?.[0];

    if (result && result.timestamp && result.indicators?.quote?.[0]) {
      const timestamps = result.timestamp;
      const quoteData = result.indicators.quote[0];
      const closes = (quoteData.close || []).filter((v: number | null) => v !== null) as number[];
      const highs = (quoteData.high || []).filter((v: number | null) => v !== null) as number[];
      const lows = (quoteData.low || []).filter((v: number | null) => v !== null) as number[];
      const opens = (quoteData.open || []).filter((v: number | null) => v !== null) as number[];

      if (closes.length > 0) {
        return {
          timestamps,
          closes,
          highs: highs.length > 0 ? highs : closes,
          lows: lows.length > 0 ? lows : closes,
          opens: opens.length > 0 ? opens : closes
        };
      }
    }

    // No synthetic fallback. Return null when real candle series is unavailable.
    return null;
  }

  /**
   * Fetch market news headlines
   * Returns empty array if no real data source succeeds. Never returns synthetic news.
   */
  public async fetchMarketNews(category = 'general'): Promise<MarketNewsArticle[]> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const url = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.slice(0, 10).map((item: any) => ({
              id: item.id,
              headline: item.headline || 'Market Update',
              summary: item.summary || '',
              url: item.url || '#',
              source: item.source || 'Finnhub',
              datetime: item.datetime ? item.datetime * 1000 : Date.now(),
              image: item.image
            }));
          }
        }
      } catch (_) {}
    }

    // Return empty array when no real news is available.
    return [];
  }

  /**
   * Fetch top gainers & losers watchlist
   */
  public async fetchTopTrending(symbols: string[] = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'SPY', 'QQQ']): Promise<{ gainers: StockQuote[]; losers: StockQuote[] }> {
    const quotes = await Promise.allSettled(symbols.map(s => this.fetchQuote(s)));
    const validQuotes: StockQuote[] = [];

    for (const q of quotes) {
      if (q.status === 'fulfilled' && q.value !== null) {
        validQuotes.push(q.value);
      }
    }

    if (validQuotes.length === 0) {
      return { gainers: [], losers: [] };
    }

    const sorted = [...validQuotes].sort((a, b) => b.percentChange - a.percentChange);
    const gainers = sorted.filter(q => q.percentChange >= 0);
    const losers = sorted.filter(q => q.percentChange < 0).reverse();

    return { gainers, losers };
  }
}

export const finnhubService = new FinnhubService();
export default finnhubService;
