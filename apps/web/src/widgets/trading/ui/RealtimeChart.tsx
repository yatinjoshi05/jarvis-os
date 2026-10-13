import React, { useMemo } from 'react';
import { StockCandle } from '../../../entities/trading/FinnhubService';

interface RealtimeChartProps {
  symbol: string;
  candleData: StockCandle | null;
  currentPrice?: number;
  changePercent?: number;
  isLoading: boolean;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  symbol,
  candleData,
  currentPrice,
  changePercent = 0,
  isLoading
}) => {
  const chartPoints = useMemo(() => {
    if (!candleData || !candleData.closes || candleData.closes.length === 0) return '';
    const closes = candleData.closes;
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;

    const width = 320;
    const height = 110;
    const padding = 10;

    return closes
      .map((val, idx) => {
        const x = padding + (idx / (closes.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [candleData]);

  const isPositive = changePercent >= 0;
  const strokeColor = isPositive ? '#00FFCC' : '#FF0055';

  if (isLoading) {
    return (
      <div className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-center items-center font-mono">
        <div className="w-5 h-5 border-2 border-t-[#00DFFF] border-white/10 rounded-full animate-spin mb-2" />
        <span className="text-[9px] text-white/50 animate-pulse">Fetching live candles from Finnhub...</span>
      </div>
    );
  }

  if (!candleData || !candleData.closes || candleData.closes.length === 0) {
    return (
      <div className="w-full h-36 bg-black/40 border border-[#FF0055]/30 rounded-xl p-4 flex flex-col justify-center items-center font-mono text-center space-y-1.5">
        <span className="text-[10px] font-black text-[#FF0055] uppercase tracking-wider">LIVE MARKET CHART UNAVAILABLE</span>
        <span className="text-[8.5px] text-white/60 max-w-xs leading-relaxed">
          No live market API key configured. Synthetic price generators have been removed to preserve financial data integrity.
        </span>
      </div>
    );
  }

  const closes = candleData.closes;
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);

  return (
    <div className="w-full border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between font-mono select-none">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black text-white">{symbol}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-bold">LIVE D1</span>
        </div>
        {currentPrice !== undefined && (
          <div className="text-right">
            <span className="text-xs font-black text-white mr-2">${currentPrice.toFixed(2)}</span>
            <span className={`text-[9px] font-bold ${isPositive ? 'text-[#00FFCC]' : 'text-[#FF0055]'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-28 my-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 320 110" preserveAspectRatio="none">
          {/* Gradient area */}
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area polygon */}
          {chartPoints && (
            <polygon
              points={`10,100 ${chartPoints} 310,100`}
              fill={`url(#gradient-${symbol})`}
            />
          )}

          {/* Line path */}
          {chartPoints && (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartPoints}
            />
          )}
        </svg>

        {/* High / Low Indicator Overlay */}
        <div className="absolute top-0 right-1 text-[7px] text-white/30 font-bold">H: ${maxPrice.toFixed(2)}</div>
        <div className="absolute bottom-0 right-1 text-[7px] text-white/30 font-bold">L: ${minPrice.toFixed(2)}</div>
      </div>

      <div className="flex justify-between items-center text-[8px] text-white/30 border-t border-white/5 pt-1.5">
        <span>30-Day Historical Range</span>
        <span className="text-[#00DFFF] font-bold">FINNHUB LIVE FEED</span>
      </div>
    </div>
  );
};
