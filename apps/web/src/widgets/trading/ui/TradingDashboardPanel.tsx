import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, AlertTriangle, Key, Search, 
  ShieldAlert, Activity, LayoutGrid, RotateCcw, Save, Check
} from 'lucide-react';
import { finnhubService, StockQuote, StockCandle, MarketNewsArticle } from '../../../entities/trading/FinnhubService';
import { financialManager } from '../../../entities/financial/FinancialManager';
import { RealtimeChart } from './RealtimeChart';
import { MarketNewsFeed } from './MarketNewsFeed';
import { TrendingMarkets } from './TrendingMarkets';
import { PortfolioLiveOverview } from './PortfolioLiveOverview';
import { useEditableLayout, LayoutElementConfig } from '../../../shared/layout/useEditableLayout';
import { EditableLayoutContainer } from '../../../shared/layout/EditableLayoutContainer';

const WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'SPY', 'QQQ'];

const DEFAULT_TRADING_HUD_ELEMENTS: LayoutElementConfig[] = [
  { id: 'chart', label: 'Price & Candlestick Chart', order: 0, widthRatio: 1.0, heightPx: 350, opacity: 1.0, fontSizeScale: 1.0, visible: true },
  { id: 'portfolio', label: 'Live Portfolio Overview', order: 1, widthRatio: 1.0, heightPx: 250, opacity: 1.0, fontSizeScale: 1.0, visible: true },
  { id: 'trending', label: 'Top Gainers & Losers', order: 2, widthRatio: 1.0, heightPx: 250, opacity: 1.0, fontSizeScale: 1.0, visible: true },
  { id: 'watchlist', label: 'Watchlist Quick Select', order: 3, widthRatio: 1.0, heightPx: 200, opacity: 1.0, fontSizeScale: 1.0, visible: true },
  { id: 'news', label: 'Market News Feed', order: 4, widthRatio: 1.0, heightPx: 450, opacity: 1.0, fontSizeScale: 1.0, visible: true },
];

export const TradingDashboardPanel: React.FC = () => {
  const userId = 'usr_guest';

  // HUD Layout Manager
  const {
    isEditMode,
    setIsEditMode,
    activePreset,
    activeElements,
    updateElement,
    switchPreset,
    resetToDefault,
  } = useEditableLayout('trading', DEFAULT_TRADING_HUD_ELEMENTS);

  const [saveToast, setSaveToast] = useState(false);

  // Helper map for element configurations by ID
  const elMap = activeElements.reduce<Record<string, LayoutElementConfig>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  // State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [customSymbolInput, setCustomSymbolInput] = useState<string>('');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<StockCandle | null>(null);
  const [news, setNews] = useState<MarketNewsArticle[]>([]);
  const [gainers, setGainers] = useState<StockQuote[]>([]);
  const [losers, setLosers] = useState<StockQuote[]>([]);
  const [liveQuotesMap, setLiveQuotesMap] = useState<Record<string, StockQuote>>({});

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  // Track user portfolio
  const portfolio = financialManager.getPortfolio(userId);

  // Main data fetching routine
  const loadMarketData = useCallback(async (symbolToFetch: string) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [quoteRes, candleRes, newsRes, trendingRes] = await Promise.all([
        finnhubService.fetchQuote(symbolToFetch),
        finnhubService.fetchCandles(symbolToFetch, 30).catch(() => null),
        finnhubService.fetchMarketNews('general').catch(() => []),
        finnhubService.fetchTopTrending(WATCHLIST_SYMBOLS).catch(() => ({ gainers: [], losers: [] }))
      ]);

      setQuote(quoteRes);
      setCandles(candleRes);
      setNews(newsRes);
      setGainers(trendingRes.gainers);
      setLosers(trendingRes.losers);

      if (!quoteRes) {
        setApiError('No active market API key is configured. Synthetic fallback prices have been removed to enforce strict financial data integrity.');
      } else {
        const newMap: Record<string, StockQuote> = {};
        newMap[quoteRes.symbol] = quoteRes;
        for (const g of trendingRes.gainers) newMap[g.symbol] = g;
        for (const l of trendingRes.losers) newMap[l.symbol] = l;
        setLiveQuotesMap(prev => ({ ...prev, ...newMap }));
      }

    } catch (e: any) {
      console.error('[TradingDashboard] Failed to fetch live market data from Finnhub:', e);
      setApiError(e.message || 'Market data temporarily unavailable. Check internet connection or API rate limit.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData(selectedSymbol);
  }, [selectedSymbol, loadMarketData]);

  const handleSearchSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbolInput.trim()) return;
    const sym = customSymbolInput.trim().toUpperCase();
    setSelectedSymbol(sym);
    setCustomSymbolInput('');
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      finnhubService.setApiKey(apiKeyInput.trim());
      setApiKeyModalOpen(false);
      loadMarketData(selectedSymbol);
    }
  };

  const handleSaveLayout = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
    setIsEditMode(false);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono select-none overflow-y-auto hide-scrollbar p-1 text-white text-left">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-[#00FFCC] animate-pulse" />
          <span className="text-xs font-black tracking-widest text-white uppercase">TRADING MARKET INTELLIGENCE</span>
          <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold uppercase border ${
            finnhubService.hasCustomApiKey() && quote
              ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/20'
              : 'bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055]/20'
          }`}>
            {finnhubService.hasCustomApiKey() && quote ? 'LIVE FINNHUB DATA' : 'NO LIVE DATA SOURCE'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* HUD EDIT MODE TOGGLE & PRESETS */}
          <div className="flex items-center space-x-1 border border-[#00FFCC]/30 bg-black/60 p-1 rounded-xl">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-2.5 py-1 rounded-lg border text-[8.5px] font-bold flex items-center space-x-1 uppercase transition-all ${
                isEditMode
                  ? 'bg-[#00FFCC] text-black border-[#00FFCC] animate-pulse shadow-lg'
                  : 'bg-white/5 border-white/10 text-[#00FFCC] hover:bg-[#00FFCC]/20'
              }`}
            >
              <LayoutGrid size={11} />
              <span>{isEditMode ? 'EXIT HUD EDIT' : 'CUSTOMIZE HUD'}</span>
            </button>

            {isEditMode && (
              <>
                <div className="flex items-center space-x-1 pl-1 border-l border-white/10">
                  {(['layout_1', 'layout_2', 'layout_3'] as const).map((slot, idx) => (
                    <button
                      key={slot}
                      onClick={() => switchPreset(slot)}
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                        activePreset === slot
                          ? 'bg-[#00DFFF] text-black'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      Slot {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={resetToDefault}
                  className="p-1 hover:text-red-400 text-white/50 text-[8px] flex items-center space-x-0.5"
                  title="Reset Layout to Default"
                >
                  <RotateCcw size={10} />
                </button>

                <button
                  onClick={handleSaveLayout}
                  className="px-2 py-0.5 bg-[#00FFCC]/20 border border-[#00FFCC]/40 text-[#00FFCC] hover:bg-[#00FFCC]/30 rounded text-[8px] font-bold flex items-center space-x-1"
                >
                  <Save size={9} />
                  <span>SAVE</span>
                </button>
              </>
            )}
          </div>

          {/* Symbol Search Input */}
          <form onSubmit={handleSearchSymbol} className="flex items-center space-x-1">
            <input
              type="text"
              value={customSymbolInput}
              onChange={(e) => setCustomSymbolInput(e.target.value)}
              placeholder="Search ticker (e.g. NVDA)..."
              className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] outline-none focus:border-[#00DFFF] w-36 uppercase"
            />
            <button
              type="submit"
              className="p-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-white/70 hover:text-white"
            >
              <Search size={10} />
            </button>
          </form>

          {/* Refresh Data */}
          <button
            onClick={() => loadMarketData(selectedSymbol)}
            disabled={isLoading}
            className="p-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-white/70 hover:text-white transition-all disabled:opacity-40"
            title="Refresh Live Quotes"
          >
            <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className={`flex items-center space-x-1 px-2 py-1 border rounded text-[8px] font-bold transition-all ${
              finnhubService.hasCustomApiKey()
                ? 'bg-[#00FFCC]/10 border-[#00FFCC]/30 text-[#00FFCC]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Key size={9} />
            <span>{finnhubService.hasCustomApiKey() ? 'API KEY ACTIVE' : 'SET FINNHUB KEY'}</span>
          </button>
        </div>
      </div>

      {/* SAVE TOAST BANNER */}
      {saveToast && (
        <div className="bg-[#00FFCC]/20 border border-[#00FFCC]/40 text-[#00FFCC] rounded-lg p-2 text-center text-[9px] font-bold flex items-center justify-center space-x-1 uppercase">
          <Check size={12} />
          <span>HUD Layout Saved &amp; Persisted to Profile {activePreset.toUpperCase()}!</span>
        </div>
      )}

      {/* EDIT MODE WARNING BANNER */}
      {isEditMode && (
        <div className="border border-[#00FFCC]/40 bg-[#00FFCC]/10 rounded-xl p-2.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-[9px] text-[#00FFCC] font-bold uppercase">
            <LayoutGrid size={14} className="animate-spin" />
            <span>YOU ARE IN HUD EDIT MODE — Drag, resize, adjust opacity, font sizes, and toggle panel visibility below.</span>
          </div>
          <span className="text-[8px] text-white/50">Active Slot: {activePreset.toUpperCase()}</span>
        </div>
      )}

      {/* MANDATORY DISCLAIMER BANNER */}
      <div className="border border-[#FF0055]/30 bg-[#FF0055]/5 rounded-lg p-2 flex items-start space-x-2 flex-shrink-0">
        <ShieldAlert size={12} className="text-[#FF0055] flex-shrink-0 mt-0.5" />
        <div className="text-[7.5px] leading-normal text-white/80">
          <span className="text-[#FF0055] font-black uppercase mr-1">[READ-ONLY ANALYSIS &amp; EDUCATIONAL STRATEGY]</span>
          Live market prices and news feeds provided for educational observation. Financial statistics are historical/backward-looking observations only, never profit predictions or trade execution guarantees.
        </div>
      </div>

      {/* API ERROR BANNER */}
      {apiError && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-amber-300 uppercase">Market Data Temporarily Unavailable</span>
              <span className="text-[8px] text-white/60">{apiError}</span>
            </div>
          </div>
          <button
            onClick={() => loadMarketData(selectedSymbol)}
            className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-200 rounded text-[8px] font-bold"
          >
            RETRY FETCH
          </button>
        </div>
      )}

      {/* DATA-DRIVEN HUD EDITABLE DASHBOARD CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* COLUMN 1: CHART & LIVE PORTFOLIO */}
        <div className="flex flex-col gap-3 min-h-0">
          {elMap['chart'] && (
            <EditableLayoutContainer
              config={elMap['chart']}
              isEditMode={isEditMode}
              onUpdate={(partial) => updateElement('chart', partial)}
            >
              <RealtimeChart
                symbol={selectedSymbol}
                candleData={candles}
                currentPrice={quote?.currentPrice}
                changePercent={quote?.percentChange}
                isLoading={isLoading}
              />
            </EditableLayoutContainer>
          )}

          {elMap['portfolio'] && (
            <EditableLayoutContainer
              config={elMap['portfolio']}
              isEditMode={isEditMode}
              onUpdate={(partial) => updateElement('portfolio', partial)}
            >
              <PortfolioLiveOverview
                cashBalance={portfolio.cashBalance}
                holdings={portfolio.holdings}
                liveQuotes={liveQuotesMap}
              />
            </EditableLayoutContainer>
          )}
        </div>

        {/* COLUMN 2: TOP GAINERS/LOSERS & WATCHLIST */}
        <div className="flex flex-col gap-3 min-h-0">
          {elMap['trending'] && (
            <EditableLayoutContainer
              config={elMap['trending']}
              isEditMode={isEditMode}
              onUpdate={(partial) => updateElement('trending', partial)}
            >
              <TrendingMarkets
                gainers={gainers}
                losers={losers}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                selectedSymbol={selectedSymbol}
                isLoading={isLoading}
              />
            </EditableLayoutContainer>
          )}

          {elMap['watchlist'] && (
            <EditableLayoutContainer
              config={elMap['watchlist']}
              isEditMode={isEditMode}
              onUpdate={(partial) => updateElement('watchlist', partial)}
            >
              <div className="border border-white/10 rounded-xl bg-black/40 p-3 flex flex-col justify-between flex-1 min-h-0">
                <div className="text-[9px] font-bold text-white/50 border-b border-white/5 pb-1.5 uppercase">WATCHLIST QUICK SELECT</div>
                <div className="grid grid-cols-2 gap-1.5 my-auto">
                  {WATCHLIST_SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={`py-1.5 px-2 rounded border text-[9px] font-bold transition-all ${
                        selectedSymbol === sym
                          ? 'bg-[#00DFFF]/15 border-[#00DFFF]/40 text-[#00DFFF]'
                          : 'bg-black/20 border-white/5 hover:bg-white/5 text-white/70'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </EditableLayoutContainer>
          )}
        </div>

        {/* COLUMN 3: MARKET NEWS FEED */}
        <div className="flex flex-col min-h-0">
          {elMap['news'] && (
            <EditableLayoutContainer
              config={elMap['news']}
              isEditMode={isEditMode}
              onUpdate={(partial) => updateElement('news', partial)}
            >
              <MarketNewsFeed
                articles={news}
                isLoading={isLoading}
              />
            </EditableLayoutContainer>
          )}
        </div>

      </div>

      {/* API KEY CONFIG MODAL */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl text-left">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Key size={14} className="text-[#00FFCC]" />
              <h3 className="text-xs font-black text-white uppercase">Configure Finnhub API Key</h3>
            </div>

            <p className="text-[9px] text-white/60 leading-relaxed">
              Finnhub provides a free tier with 60 requests/minute for real-time stock prices, candlestick data, and financial market news.
              Enter your key below to activate custom API access.
            </p>

            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste Finnhub API Key here..."
              className="w-full bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[#00FFCC]"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setApiKeyModalOpen(false)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[9px] font-bold text-white/70"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 bg-[#00FFCC] text-black hover:bg-[#00E0B8] rounded text-[9px] font-bold transition-all"
              >
                SAVE KEY
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TradingDashboardPanel;
