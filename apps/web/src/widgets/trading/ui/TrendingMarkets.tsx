import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockQuote } from '../../../entities/trading/FinnhubService';

interface TrendingMarketsProps {
  gainers: StockQuote[];
  losers: StockQuote[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  isLoading: boolean;
}

export const TrendingMarkets: React.FC<TrendingMarketsProps> = ({
  gainers,
  losers,
  onSelectSymbol,
  selectedSymbol,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-44 bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-center items-center font-mono">
        <div className="w-4 h-4 border-2 border-t-[#00FFCC] border-white/10 rounded-full animate-spin mb-2" />
        <span className="text-[9px] text-white/40 animate-pulse">Calculating market gainers & losers...</span>
      </div>
    );
  }

  return (
    <div className="w-full border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between font-mono select-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center space-x-2">
          <TrendingUp size={12} className="text-[#00FFCC]" />
          <span className="text-[10px] font-black tracking-widest uppercase text-white">TOP GAINERS & LOSERS</span>
        </div>
        <span className="text-[8px] text-white/30 font-bold uppercase">MARKET METRICS</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2 text-left">
        {/* Gainers */}
        <div className="space-y-1">
          <div className="text-[7px] text-[#00FFCC] font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
            <TrendingUp size={9} />
            <span>Top Gainers</span>
          </div>
          {gainers.slice(0, 4).map((q) => (
            <button
              key={q.symbol}
              onClick={() => onSelectSymbol(q.symbol)}
              className={`w-full flex justify-between items-center p-1.5 rounded border transition-all text-[9px] ${
                selectedSymbol === q.symbol
                  ? 'bg-[#00FFCC]/10 border-[#00FFCC]/30 text-white font-bold'
                  : 'bg-black/25 border-white/5 hover:bg-white/5 text-white/80'
              }`}
            >
              <span className="font-bold">{q.symbol}</span>
              <div className="text-right">
                <div className="text-[8px] font-black">${q.currentPrice.toFixed(2)}</div>
                <div className="text-[7px] text-[#00FFCC] font-bold">+{q.percentChange.toFixed(2)}%</div>
              </div>
            </button>
          ))}
        </div>

        {/* Losers */}
        <div className="space-y-1">
          <div className="text-[7px] text-[#FF0055] font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
            <TrendingDown size={9} />
            <span>Top Losers</span>
          </div>
          {losers.slice(0, 4).map((q) => (
            <button
              key={q.symbol}
              onClick={() => onSelectSymbol(q.symbol)}
              className={`w-full flex justify-between items-center p-1.5 rounded border transition-all text-[9px] ${
                selectedSymbol === q.symbol
                  ? 'bg-[#FF0055]/10 border-[#FF0055]/30 text-white font-bold'
                  : 'bg-black/25 border-white/5 hover:bg-white/5 text-white/80'
              }`}
            >
              <span className="font-bold">{q.symbol}</span>
              <div className="text-right">
                <div className="text-[8px] font-black">${q.currentPrice.toFixed(2)}</div>
                <div className="text-[7px] text-[#FF0055] font-bold">{q.percentChange.toFixed(2)}%</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
