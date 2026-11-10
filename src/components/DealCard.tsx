import React from 'react';
import { Deal } from '../types';
import { ExternalLink, X, Zap, Tag, Clock } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onDismiss: (dealId: string) => void;
  onOpenDetail?: (deal: Deal) => void;
  priorityTier: 'siren' | 'second' | 'regular';
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onDismiss,
  priorityTier,
}) => {
  const isGlitch = deal.category === 'price_error' || deal.product.isPricingGlitch || deal.score >= 90;

  const handleClickDeal = () => {
    const targetUrl = deal.product.productUrl || deal.originalPostUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't open deal
    onDismiss(deal.id);
  };

  return (
    <div
      onClick={handleClickDeal}
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
        priorityTier === 'siren'
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50 shadow-md shadow-rose-950/30 hover:border-rose-400'
          : priorityTier === 'second'
          ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Top row: Badges & Dismiss button */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tier Badge */}
          {priorityTier === 'siren' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse shadow-sm">
              <span>🚨</span>
              <span>PRICE ERROR / STEAL</span>
            </span>
          ) : priorityTier === 'second' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>HIGH VALUE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>REGULAR DEAL</span>
            </span>
          )}

          {/* Retailer */}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
            {deal.product.retailer}
          </span>
        </div>

        {/* Side Dismiss Button: "Not interested" */}
        <button
          onClick={handleDismiss}
          className="p-1.5 -mr-1 -mt-1 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer shrink-0"
          title="Not interested (Remove for this time)"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Product Title */}
      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition line-clamp-2 leading-snug mb-3">
        {deal.product.productName}
      </h3>

      {/* Price drop display */}
      <div className="flex items-baseline gap-2.5 flex-wrap mb-4">
        {deal.product.dealPrice !== null ? (
          <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            ${deal.product.dealPrice.toFixed(2)}
          </span>
        ) : (
          <span className="text-base font-bold text-slate-300">See Sale Link</span>
        )}

        {deal.product.originalPrice !== null && deal.product.dealPrice !== null && (
          <span className="text-xs sm:text-sm text-slate-500 line-through">
            ${deal.product.originalPrice.toFixed(2)}
          </span>
        )}

        {deal.product.discountPercentage !== null && deal.product.discountPercentage > 0 && (
          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
            deal.product.discountPercentage >= 70
              ? 'bg-rose-500 text-white'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            -{deal.product.discountPercentage}% OFF
          </span>
        )}

        {deal.product.couponCode && (
          <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
            Code: {deal.product.couponCode}
          </span>
        )}
      </div>

      {/* Footer: Source + Direct Link Action */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400 text-[11px] font-mono">
          via <strong className="text-slate-300">{deal.sourceAccount}</strong>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm ${
            priorityTier === 'siren'
              ? 'bg-rose-600 group-hover:bg-rose-500 text-white'
              : 'bg-emerald-600 group-hover:bg-emerald-500 text-white'
          }`}
        >
          <span>Open Deal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
