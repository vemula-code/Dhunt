import React, { useState, useMemo } from 'react';
import { Deal, DealCategory, PriorityLevel, DealFilterOptions, AppSettings } from '../../types';
import { DealCard } from '../DealCard';
import {
  Flame,
  Zap,
  ShieldAlert,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  CopyX,
  AlertCircle,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

interface DashboardViewProps {
  deals: Deal[];
  notificationsCountToday: number;
  duplicateCount: number;
  expiredCount: number;
  queueCount: number;
  settings: AppSettings;
  onOpenDetail: (deal: Deal) => void;
  onToggleSave: (dealId: string) => void;
  onDismiss: (dealId: string) => void;
  onPreparePurchase: (deal: Deal) => void;
  onSimulateBurst: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  deals,
  notificationsCountToday,
  duplicateCount,
  expiredCount,
  queueCount,
  settings,
  onOpenDetail,
  onToggleSave,
  onDismiss,
  onPreparePurchase,
  onSimulateBurst,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DealCategory | 'all'>('all');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [onlyGlitches, setOnlyGlitches] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'discount' | 'price_low'>('newest');

  // Active (non-dismissed) deals
  const activeDeals = useMemo(() => deals.filter((d) => !d.isDismissed), [deals]);

  // Metrics
  const criticalDeals = useMemo(
    () => activeDeals.filter((d) => d.priority === 'critical' || d.category === 'price_error'),
    [activeDeals]
  );
  const highPriorityDeals = useMemo(
    () => activeDeals.filter((d) => d.priority === 'excellent' || d.priority === 'critical'),
    [activeDeals]
  );

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return activeDeals.filter((deal) => {
      if (onlyGlitches && deal.category !== 'price_error' && !deal.product.isPricingGlitch) {
        return false;
      }
      if (selectedCategory !== 'all' && deal.category !== selectedCategory) {
        return false;
      }
      if (selectedRetailer !== 'all' && deal.product.retailer !== selectedRetailer) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${deal.product.productName} ${deal.product.brand || ''} ${deal.product.retailer} ${deal.sourceAccount} ${deal.rawNotificationText}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'discount') return (b.product.discountPercentage || 0) - (a.product.discountPercentage || 0);
      if (sortBy === 'price_low') return (a.product.dealPrice || 999999) - (b.product.dealPrice || 999999);
      return b.createdAt - a.createdAt; // newest
    });
  }, [activeDeals, searchQuery, selectedCategory, selectedRetailer, onlyGlitches, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Captured Today</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-white">{notificationsCountToday}</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Active Deals</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-400">{activeDeals.length}</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-rose-300">Price Glitches</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-400">{criticalDeals.length}</span>
            <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-300">High Priority (75+)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-400">{highPriorityDeals.length}</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Duplicates Removed</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-300">{duplicateCount}</span>
            <CopyX className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Expired / OOS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-400">{expiredCount}</span>
            <AlertCircle className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Metric 7 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-400">Queue & Status</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-slate-300">
              {queueCount > 0 ? `${queueCount} Queued` : 'Synced'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Critical Pricing Glitches Alert Banner */}
      {criticalDeals.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/40 shadow-xl shadow-rose-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {criticalDeals.length} Critical Opportunity Detected
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    URGENT
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5 line-clamp-1">
                  Top Deal: <strong>{criticalDeals[0].product.productName}</strong> at ${criticalDeals[0].product.dealPrice?.toFixed(2)} (-{criticalDeals[0].product.discountPercentage}%) via {criticalDeals[0].sourceAccount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenDetail(criticalDeals[0])}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                Inspect Glitch
              </button>
              {criticalDeals[0].product.productUrl && (
                <a
                  href={criticalDeals[0].product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals, products, brands, or X accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Quick Glitch Toggle Button */}
          <button
            onClick={() => setOnlyGlitches(!onlyGlitches)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              onlyGlitches
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${onlyGlitches ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>Glitches Only</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="score">Sort: Highest Score</option>
              <option value="discount">Sort: Deepest Discount %</option>
              <option value="price_low">Sort: Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Category & Retailer Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Retailer filter */}
          <select
            value={selectedRetailer}
            onChange={(e) => setSelectedRetailer(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Retailers</option>
            <option value="Amazon">Amazon</option>
            <option value="Walmart">Walmart</option>
            <option value="Best Buy">Best Buy</option>
            <option value="Target">Target</option>
            <option value="Newegg">Newegg</option>
            <option value="Other">Other</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Deal Categories</option>
            <option value="price_error">Price Error / Glitch</option>
            <option value="extreme_discount">Extreme Discount (&gt;70%)</option>
            <option value="regular_discount">Regular Discount</option>
            <option value="coupon_promo">Coupon / Promo Code</option>
            <option value="clearance">Clearance</option>
            <option value="lightning_deal">Lightning / Limited Time</option>
            <option value="freebie">Freebie</option>
          </select>

          {(searchQuery || selectedCategory !== 'all' || selectedRetailer !== 'all' || onlyGlitches) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRetailer('all');
                setOnlyGlitches(false);
              }}
              className="text-[11px] text-amber-400 hover:underline px-1 cursor-pointer"
            >
              Reset filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400">
            Showing <strong className="text-white">{filteredDeals.length}</strong> deals
          </div>
        </div>
      </div>

      {/* Deal Grid */}
      {filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onOpenDetail={onOpenDetail}
              onToggleSave={onToggleSave}
              onDismiss={onDismiss}
              onPreparePurchase={onPreparePurchase}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Matching Deals Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No deals matched your current filters or query. Try resetting filters or triggering a simulation burst.
          </p>
          <button
            onClick={onSimulateBurst}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Simulate 3 Deals Now
          </button>
        </div>
      )}
    </div>
  );
};
