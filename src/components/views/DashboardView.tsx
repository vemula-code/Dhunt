import React, { useState, useMemo } from 'react';
import { Deal } from '../../types';
import { DealCard } from '../DealCard';
import { Zap, Sparkles, Tag, ChevronDown, ChevronUp, Search, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
  deals: Deal[];
  onDismiss: (dealId: string) => void;
  onSimulateDeal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  deals,
  onDismiss,
  onSimulateDeal,
}) => {
  const [search, setSearch] = useState('');
  const [expandedTier1, setExpandedTier1] = useState(false);
  const [expandedTier2, setExpandedTier2] = useState(false);
  const [expandedTier3, setExpandedTier3] = useState(false);

  // Active (non-dismissed) deals
  const activeDeals = useMemo(() => {
    let list = deals.filter((d) => !d.isDismissed);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        `${d.product.productName} ${d.product.brand || ''} ${d.sourceAccount} ${d.product.retailer}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [deals, search]);

  // 1. Tier 1: 🚨 DEALS ALERT (Siren Symbol, Price Errors, Steal Deals >70% Off)
  const tier1Deals = useMemo(() => {
    return activeDeals.filter(
      (d) =>
        d.category === 'price_error' ||
        d.product.isPricingGlitch ||
        (d.product.discountPercentage && d.product.discountPercentage >= 70) ||
        d.score >= 85
    );
  }, [activeDeals]);

  // 2. Tier 2: ⚡ SECOND PRIORITY (Lightning Deals, High Coupons & Major Brands 40-69% off)
  const tier2Deals = useMemo(() => {
    const tier1Ids = new Set(tier1Deals.map((d) => d.id));
    return activeDeals.filter((d) => {
      if (tier1Ids.has(d.id)) return false;
      return (
        d.category === 'lightning_deal' ||
        d.category === 'coupon_promo' ||
        (d.product.discountPercentage && d.product.discountPercentage >= 40) ||
        d.score >= 60
      );
    });
  }, [activeDeals, tier1Deals]);

  // 3. Tier 3: 🏷️ REGULAR DEALS (Everyday Discounts, Clearance, Standard Shopping)
  const tier3Deals = useMemo(() => {
    const tier1Ids = new Set(tier1Deals.map((d) => d.id));
    const tier2Ids = new Set(tier2Deals.map((d) => d.id));
    return activeDeals.filter((d) => !tier1Ids.has(d.id) && !tier2Ids.has(d.id));
  }, [activeDeals, tier1Deals, tier2Deals]);

  const displayedTier1 = expandedTier1 ? tier1Deals : tier1Deals.slice(0, 3);
  const displayedTier2 = expandedTier2 ? tier2Deals : tier2Deals.slice(0, 3);
  const displayedTier3 = expandedTier3 ? tier3Deals : tier3Deals.slice(0, 3);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter deals by product, retailer, or X account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none shadow-sm"
        />
      </div>

      {/* =======================================================================
          CATEGORY 1: 🚨 DEALS ALERT (PRICE ERRORS & STEAL DEALS)
         ======================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-rose-500/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-rose-400 tracking-tight flex items-center gap-2">
                <span>TOP PRIORITY DEALS ALERT</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {tier1Deals.length} DEALS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Price errors, retailer glitches, and extreme steals (&gt;70% OFF)
              </p>
            </div>
          </div>

          {tier1Deals.length > 3 && (
            <button
              onClick={() => setExpandedTier1(!expandedTier1)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{expandedTier1 ? 'Show Top 3' : `View All (${tier1Deals.length})`}</span>
              {expandedTier1 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {displayedTier1.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {displayedTier1.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                priorityTier="siren"
                onDismiss={onDismiss}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
            No active price glitches or extreme steals right now.{' '}
            <button
              onClick={onSimulateDeal}
              className="text-amber-400 font-bold hover:underline ml-1 cursor-pointer"
            >
              Simulate a price error deal
            </button>
          </div>
        )}
      </section>

      {/* =======================================================================
          CATEGORY 2: ⚡ SECOND PRIORITY (LIGHTNING & COUPONS)
         ======================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-400 tracking-tight flex items-center gap-2">
                <span>SECOND PRIORITY DEALS</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {tier2Deals.length} DEALS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lightning limited-time offers, high-value coupons, and 40–69% discounts
              </p>
            </div>
          </div>

          {tier2Deals.length > 3 && (
            <button
              onClick={() => setExpandedTier2(!expandedTier2)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{expandedTier2 ? 'Show Top 3' : `View All (${tier2Deals.length})`}</span>
              {expandedTier2 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {displayedTier2.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {displayedTier2.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                priorityTier="second"
                onDismiss={onDismiss}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
            No second-priority deals at the moment.
          </div>
        )}
      </section>

      {/* =======================================================================
          CATEGORY 3: 🏷️ REGULAR DEALS (CLEARANCE & EVERYDAY)
         ======================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-200 tracking-tight flex items-center gap-2">
                <span>REGULAR DEALS & CLEARANCE</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {tier3Deals.length} DEALS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Store clearance rollbacks, everyday price drops, and standard sales
              </p>
            </div>
          </div>

          {tier3Deals.length > 3 && (
            <button
              onClick={() => setExpandedTier3(!expandedTier3)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <span>{expandedTier3 ? 'Show Top 3' : `View All (${tier3Deals.length})`}</span>
              {expandedTier3 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {displayedTier3.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {displayedTier3.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                priorityTier="regular"
                onDismiss={onDismiss}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
            No regular deals in feed.
          </div>
        )}
      </section>
    </div>
  );
};
