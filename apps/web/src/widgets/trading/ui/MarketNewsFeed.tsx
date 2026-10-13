import React from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { MarketNewsArticle } from '../../../entities/trading/FinnhubService';

interface MarketNewsFeedProps {
  articles: MarketNewsArticle[];
  isLoading: boolean;
}

export const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ articles, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-center items-center font-mono">
        <div className="w-4 h-4 border-2 border-t-[#00DFFF] border-white/10 rounded-full animate-spin mb-2" />
        <span className="text-[9px] text-white/40 animate-pulse">Loading live market headlines...</span>
      </div>
    );
  }

  return (
    <div className="w-full border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between font-mono select-none flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Newspaper size={12} className="text-[#00DFFF]" />
          <span className="text-[10px] font-black tracking-widest uppercase text-white">MARKET NEWS FEED</span>
        </div>
        <span className="text-[8px] text-white/30 font-bold uppercase">FINNHUB FEED</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2 hide-scrollbar min-h-0 text-left">
        {articles.length === 0 ? (
          <div className="text-[9px] text-white/40 text-center py-6">No news articles available.</div>
        ) : (
          articles.map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-white/5 bg-black/25 hover:bg-white/5 rounded-lg p-2.5 transition-all group"
            >
              <div className="flex justify-between items-start space-x-2">
                <span className="text-[9px] font-bold text-white/90 group-hover:text-[#00DFFF] transition-colors leading-tight flex-1">
                  {art.headline}
                </span>
                <ExternalLink size={10} className="text-white/30 group-hover:text-[#00DFFF] flex-shrink-0 mt-0.5" />
              </div>
              {art.summary && (
                <p className="text-[8px] text-white/50 leading-relaxed mt-1 line-clamp-2">
                  {art.summary}
                </p>
              )}
              <div className="flex justify-between items-center text-[7px] text-white/35 mt-1.5 pt-1 border-t border-white/5">
                <span className="font-bold text-[#00DFFF]/80">{art.source}</span>
                <span>{new Date(art.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};
