import React from 'react';
import { Deal } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../services/intelligence';
import { ExternalLink, Bookmark, Trash2, Zap, ShieldCheck, Tag, Clock, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onOpenDetail: (deal: Deal) => void;
  onToggleSave: (dealId: string) => void;
  onDismiss: (dealId: string) => void;
  onPreparePurchase?: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onOpenDetail,
  onToggleSave,
  onDismiss,
  onPreparePurchase,
}) => {
  const isGlitch = deal.category === 'price_error' || deal.product.isPricingGlitch;
  const catConfig = CATEGORY_LABELS[deal.category] || CATEGORY_LABELS.regular_discount;
  const prioConfig = PRIORITY_CONFIG[deal.priority];

  const getRetailerColor = (retailer: string) => {
    switch (retailer) {
      case 'Amazon':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Walmart':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Best Buy':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'Target':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'Newegg':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const timeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        isGlitch
          ? 'bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/20 hover:border-rose-400'
          : deal.priority === 'critical'
          ? 'bg-slate-900/90 border-amber-500/40 shadow-md hover:border-amber-400/80'
          : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      {/* Glitch / Critical accent bar */}
      {isGlitch && (
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Retailer */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRetailerColor(deal.product.retailer)}`}>
              {deal.product.retailer}
            </span>

            {/* Category */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catConfig.bg} ${catConfig.color}`}>
              {isGlitch && <Zap className="w-3 h-3 mr-1 text-rose-400 animate-bounce" />}
              {catConfig.label}
            </span>
          </div>

          {/* Priority Score pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${prioConfig.badgeColor}`}
              title={`Score: ${deal.score}/100 (${deal.scoreReasons.length} scoring factors)`}
            >
              <span>{deal.score}</span>
              <span className="text-[10px] opacity-80">/100</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(deal)}
          className="text-sm sm:text-base font-semibold text-slate-100 hover:text-amber-400 cursor-pointer line-clamp-2 transition leading-snug mb-2.5"
          title={deal.product.productName}
        >
          {deal.product.productName}
        </h3>

        {/* Pricing & Discount */}
        <div className="flex items-baseline gap-2.5 flex-wrap mb-3">
          {deal.product.dealPrice !== null ? (
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              ${deal.product.dealPrice.toFixed(2)}
            </span>
          ) : (
            <span className="text-base font-semibold text-slate-400">See Retailer</span>
          )}

          {deal.product.originalPrice !== null && deal.product.dealPrice !== null && (
            <span className="text-xs sm:text-sm text-slate-500 line-through">
              ${deal.product.originalPrice.toFixed(2)}
            </span>
          )}

          {deal.product.discountPercentage !== null && deal.product.discountPercentage > 0 && (
            <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
              deal.product.discountPercentage >= 70 ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              -{deal.product.discountPercentage}%
            </span>
          )}
        </div>

        {/* Coupon or Matched Rule if present */}
        <div className="space-y-1.5 mb-3">
          {deal.product.couponCode && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
              <Tag className="w-3 h-3" />
              <span>Coupon: <strong>{deal.product.couponCode}</strong></span>
            </div>
          )}

          {deal.matchedRuleName && (
            <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Rule matched: {deal.matchedRuleName}</span>
            </div>
          )}
        </div>

        {/* Source metadata */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-slate-300">{deal.sourceAccount}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              {timeAgo(deal.createdAt)}
            </span>
          </div>

          {deal.verificationStatus === 'verified_active' ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium" title="Link verified active">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified</span>
            </span>
          ) : deal.verificationStatus === 'expired_oos' ? (
            <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>Expired</span>
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">Unverified</span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleSave(deal.id)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              deal.isSaved
                ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={deal.isSaved ? 'Remove bookmark' : 'Save deal'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => onDismiss(deal.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss deal"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenDetail(deal)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            Details
          </button>
        </div>

        <div className="flex items-center gap-2">
          {deal.product.productUrl ? (
            <a
              href={deal.product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer ${
                isGlitch
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              <span>Open Deal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => onOpenDetail(deal)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <span>Inspect</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
