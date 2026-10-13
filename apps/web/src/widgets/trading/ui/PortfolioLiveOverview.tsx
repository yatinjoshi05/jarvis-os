import React from 'react';
import { Wallet } from 'lucide-react';
import { StockQuote } from '../../../entities/trading/FinnhubService';

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  assetClass: string;
}

interface PortfolioLiveOverviewProps {
  cashBalance: number;
  holdings: PortfolioHolding[];
  liveQuotes: Record<string, StockQuote>;
}

export const PortfolioLiveOverview: React.FC<PortfolioLiveOverviewProps> = ({
  cashBalance,
  holdings,
  liveQuotes
}) => {
  let totalInvestedCost = 0;
  let totalCurrentVal = 0;

  const holdingsWithLiveData = holdings.map((hold) => {
    const live = liveQuotes[hold.symbol.toUpperCase()];
    const currentPrice = live ? live.currentPrice : hold.avgPrice;
    const currentVal = hold.quantity * currentPrice;
    const costVal = hold.quantity * hold.avgPrice;
    const pnlDollar = currentVal - costVal;
    const pnlPercent = costVal > 0 ? (pnlDollar / costVal) * 100 : 0;

    totalInvestedCost += costVal;
    totalCurrentVal += currentVal;

    return {
      ...hold,
      currentPrice,
      currentVal,
      pnlDollar,
      pnlPercent,
      hasLiveQuote: !!live
    };
  });

  const totalPortfolioValue = cashBalance + totalCurrentVal;
  const totalPnLDollar = totalCurrentVal - totalInvestedCost;
  const totalPnLPercent = totalInvestedCost > 0 ? (totalPnLDollar / totalInvestedCost) * 100 : 0;
  const isTotalPositive = totalPnLDollar >= 0;

  return (
    <div className="w-full border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between font-mono select-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center space-x-2">
          <Wallet size={12} className="text-[#00FFCC]" />
          <span className="text-[10px] font-black tracking-widest uppercase text-white">PORTFOLIO LIVE P&L</span>
        </div>
        <span className="text-[8px] text-[#00FFCC] font-bold uppercase">LIVE TRACKED POSITIONS</span>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        <div className="bg-black/35 border border-white/5 rounded-lg p-2 text-left">
          <div className="text-[7px] text-white/40 font-bold uppercase">Total Net Portfolio</div>
          <div className="text-sm font-black text-white mt-0.5">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div className="bg-black/35 border border-white/5 rounded-lg p-2 text-left">
          <div className="text-[7px] text-white/40 font-bold uppercase">Live Unrealized P&L</div>
          <div className={`text-sm font-black mt-0.5 ${isTotalPositive ? 'text-[#00FFCC]' : 'text-[#FF0055]'}`}>
            {isTotalPositive ? '+' : ''}${totalPnLDollar.toFixed(2)} ({isTotalPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Holdings Live List */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar text-left">
        {holdingsWithLiveData.map((h) => {
          const isPos = h.pnlDollar >= 0;
          return (
            <div key={h.symbol} className="border border-white/5 bg-black/25 rounded p-2 text-[9px] flex justify-between items-center">
              <div>
                <div className="font-bold flex items-center space-x-1.5">
                  <span className="text-white">{h.symbol}</span>
                  <span className="text-[7px] text-white/30 uppercase">{h.assetClass}</span>
                  {h.hasLiveQuote && (
                    <span className="text-[6px] px-1 py-0.2 rounded bg-[#00FFCC]/10 text-[#00FFCC] font-bold">LIVE</span>
                  )}
                </div>
                <div className="text-white/45 text-[8px] mt-0.5">
                  {h.quantity} shares @ avg ${h.avgPrice.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-white">${h.currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`text-[8px] font-bold ${isPos ? 'text-[#00FFCC]' : 'text-[#FF0055]'}`}>
                  {isPos ? '+' : ''}${h.pnlDollar.toFixed(2)} ({isPos ? '+' : ''}{h.pnlPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
