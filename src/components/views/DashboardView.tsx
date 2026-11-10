import React, { useState, useMemo } from 'react';
import { Deal, DealCategory, AppSettings } from '../../types';
import { DealCard } from '../DealCard';
import {
  Flame,
  Zap,
  Tag,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Smartphone,
  PlusCircle,
  HelpCircle,
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
  onOpenManualIngest: () => void;
  onOpenConnect: () => void;
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
  onOpenManualIngest,
  onOpenConnect,
}) => {
  const [activeTabCategory, setActiveTabCategory] = useState<
    'all' | 'glitch' | 'steal' | 'lightning' | 'coupon' | 'clearance'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');

  // Filtered active deals
  const activeDeals = useMemo(() => deals.filter((d) => !d.isDismissed), [deals]);

  // Priority Glitches
  const glitchDeals = useMemo(
    () => activeDeals.filter((d) => d.category === 'price_error' || d.product.isPricingGlitch || d.score >= 90),
    [activeDeals]
  );

  // Extreme Steals (70%+ off)
  const stealDeals = useMemo(
    () => activeDeals.filter((d) => (d.product.discountPercentage && d.product.discountPercentage >= 70) || d.category === 'extreme_discount'),
    [activeDeals]
  );

  // Lightning Deals
  const lightningDeals = useMemo(
    () => activeDeals.filter((d) => d.category === 'lightning_deal'),
    [activeDeals]
  );

  // Coupons
  const couponDeals = useMemo(
    () => activeDeals.filter((d) => d.category === 'coupon_promo' || Boolean(d.product.couponCode)),
    [activeDeals]
  );

  // Clearance
  const clearanceDeals = useMemo(
    () => activeDeals.filter((d) => d.category === 'clearance'),
    [activeDeals]
  );

  // Filtered list based on active pill
  const displayedDeals = useMemo(() => {
    let list = activeDeals;

    if (activeTabCategory === 'glitch') {
      list = glitchDeals;
    } else if (activeTabCategory === 'steal') {
      list = stealDeals;
    } else if (activeTabCategory === 'lightning') {
      list = lightningDeals;
    } else if (activeTabCategory === 'coupon') {
      list = couponDeals;
    } else if (activeTabCategory === 'clearance') {
      list = clearanceDeals;
    }

    if (selectedRetailer !== 'all') {
      list = list.filter((d) => d.product.retailer === selectedRetailer);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) =>
        `${d.product.productName} ${d.product.brand || ''} ${d.sourceAccount} ${d.product.retailer}`
          .toLowerCase()
          .includes(q)
      );
    }

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [
    activeDeals,
    activeTabCategory,
    glitchDeals,
    stealDeals,
    lightningDeals,
    couponDeals,
    clearanceDeals,
    selectedRetailer,
    searchQuery,
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Explaining how the app reads notifications & categorizes them */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>How DealHunter Captures & Categorizes X Deals</span>
            </h3>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              100 notifications/day from accounts like @Wario64 & @BobaDeals are parsed instantly. Price errors & steals are elevated to Top Priority!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSimulateBurst}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Simulate Incoming X Deal</span>
          </button>
          <button
            onClick={onOpenConnect}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Setup Phone Sync</span>
          </button>
        </div>
      </div>

      {/* Primary Category Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Deal Categories & Priority
          </span>
          <span className="text-xs text-slate-500">
            {displayedDeals.length} deals in view
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Glitches / Price Errors */}
          <button
            onClick={() => setActiveTabCategory('glitch')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'glitch'
                ? 'bg-rose-500/25 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {glitchDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-rose-400">PRICE ERRORS</span>
              <span className="text-[10px] text-slate-400">Top Priority Alerts</span>
            </div>
          </button>

          {/* Steal Deals */}
          <button
            onClick={() => setActiveTabCategory('steal')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'steal'
                ? 'bg-amber-500/25 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {stealDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-amber-400">STEAL DEALS</span>
              <span className="text-[10px] text-slate-400">70%+ Extreme Off</span>
            </div>
          </button>

          {/* Lightning / Fast Disappearing */}
          <button
            onClick={() => setActiveTabCategory('lightning')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'lightning'
                ? 'bg-orange-500/25 border-orange-500 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-orange-500 text-white">
                {lightningDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-orange-400">LIGHTNING</span>
              <span className="text-[10px] text-slate-400">Time-Limited Deals</span>
            </div>
          </button>

          {/* Coupons & Promo Codes */}
          <button
            onClick={() => setActiveTabCategory('coupon')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'coupon'
                ? 'bg-emerald-500/25 border-emerald-500 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                {couponDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-emerald-400">COUPONS</span>
              <span className="text-[10px] text-slate-400">Promo Code Stacks</span>
            </div>
          </button>

          {/* Clearance */}
          <button
            onClick={() => setActiveTabCategory('clearance')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'clearance'
                ? 'bg-purple-500/25 border-purple-500 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-500 text-white">
                {clearanceDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-purple-400">CLEARANCE</span>
              <span className="text-[10px] text-slate-400">Store Rollbacks</span>
            </div>
          </button>

          {/* All Deals */}
          <button
            onClick={() => setActiveTabCategory('all')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              activeTabCategory === 'all'
                ? 'bg-blue-500/25 border-blue-500 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-white">
                {activeDeals.length}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-black block text-blue-400">ALL DEALS</span>
              <span className="text-[10px] text-slate-400">Full Feed</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search & Retailer filter */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals, products, or accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <select
          value={selectedRetailer}
          onChange={(e) => setSelectedRetailer(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Retailers</option>
          <option value="Amazon">Amazon</option>
          <option value="Walmart">Walmart</option>
          <option value="Best Buy">Best Buy</option>
          <option value="Target">Target</option>
        </select>
      </div>

      {/* Deals Feed */}
      {displayedDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedDeals.map((deal) => (
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
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <p className="text-slate-400 text-xs">No deals found in this category right now.</p>
          <button
            onClick={onSimulateBurst}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Simulate Deal Burst
          </button>
        </div>
      )}
    </div>
  );
};
