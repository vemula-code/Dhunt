import React, { useState, useMemo } from 'react';
import { Deal } from '../../types';
import { DealCard } from '../DealCard';
import { Flame, Zap, Bookmark, Search, CheckCircle2, ArrowUpDown } from 'lucide-react';

interface DealsViewProps {
  mode: 'live' | 'critical' | 'saved';
  deals: Deal[];
  onOpenDetail: (deal: Deal) => void;
  onToggleSave: (dealId: string) => void;
  onDismiss: (dealId: string) => void;
  onPreparePurchase: (deal: Deal) => void;
}

export const DealsView: React.FC<DealsViewProps> = ({
  mode,
  deals,
  onOpenDetail,
  onToggleSave,
  onDismiss,
  onPreparePurchase,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'newest' | 'discount'>('newest');

  const filteredDeals = useMemo(() => {
    let list = deals.filter((d) => !d.isDismissed);

    if (mode === 'critical') {
      list = list.filter((d) => d.priority === 'critical' || d.category === 'price_error' || d.score >= 90);
    } else if (mode === 'saved') {
      list = list.filter((d) => d.isSaved);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.product.productName.toLowerCase().includes(q) ||
          d.sourceAccount.toLowerCase().includes(q) ||
          d.product.retailer.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'discount') return (b.product.discountPercentage || 0) - (a.product.discountPercentage || 0);
      return b.createdAt - a.createdAt;
    });
  }, [deals, mode, search, sortBy]);

  const titles = {
    live: {
      title: 'Live Deals Feed',
      desc: 'Real-time feed of all analyzed deals across followed accounts.',
      icon: <Flame className="w-5 h-5 text-amber-400" />,
    },
    critical: {
      title: 'Critical Opportunities & Price Glitches',
      desc: 'High-urgency deals scored 90-100 or identified as pricing errors requiring instant action.',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
    },
    saved: {
      title: 'Saved & Bookmarked Deals',
      desc: 'Deals you have pinned for later checkout or price tracking.',
      icon: <Bookmark className="w-5 h-5 text-amber-400" />,
    },
  }[mode];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            {titles.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{titles.title}</h2>
            <p className="text-xs text-slate-400">{titles.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search in view..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="score">Highest Score</option>
            <option value="discount">Discount %</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              priorityTier={deal.category === 'price_error' ? 'siren' : deal.score >= 60 ? 'second' : 'regular'}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          No deals currently in this view.
        </div>
      )}
    </div>
  );
};
