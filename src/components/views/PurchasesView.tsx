import React, { useState } from 'react';
import { PurchaseRecord, AppSettings, Deal } from '../../types';
import {
  ShoppingBag,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  DollarSign,
  TrendingDown,
  XCircle,
  Clock,
} from 'lucide-react';

interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  onConfirmPurchase: (id: string) => Promise<void>;
  onCancelPurchase: (id: string) => Promise<void>;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  settings,
  onUpdateSettings,
  onConfirmPurchase,
  onCancelPurchase,
}) => {
  const autoBuy = settings.autoPurchase;

  const handleToggleAutoBuy = async () => {
    const updated: AppSettings = {
      ...settings,
      autoPurchase: {
        ...autoBuy,
        enabled: !autoBuy.enabled,
      },
    };
    await onUpdateSettings(updated);
  };

  const handleUpdateLimit = async (limit: number) => {
    const updated: AppSettings = {
      ...settings,
      autoPurchase: {
        ...autoBuy,
        dailySpendLimit: limit,
      },
    };
    await onUpdateSettings(updated);
  };

  const confirmedPurchases = purchases.filter((p) => p.status === 'user_confirmed');
  const totalSpent = confirmedPurchases.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Purchase Opportunities & History</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                autoBuy.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {autoBuy.enabled ? 'Staging Active' : 'Disabled by Default'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Safe, user-confirmed purchase staging with spending caps and zero stored payment credentials.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleAutoBuy}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            autoBuy.enabled
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          {autoBuy.enabled ? 'Disable Auto-Staging' : 'Enable Opportunity Staging'}
        </button>
      </div>

      {/* Safety & Spending Cap Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Cap */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Daily Spending Limit</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">${autoBuy.dailySpendLimit}</span>
            <span className="text-xs text-slate-400 font-mono">
              Spent today: ${autoBuy.currentDailySpent.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[25, 50, 100, 200].map((amt) => (
              <button
                key={amt}
                onClick={() => handleUpdateLimit(amt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  autoBuy.dailySpendLimit === amt
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Total Tracked Savings */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Confirmed Purchases</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">
              {confirmedPurchases.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: ${totalSpent.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Across Amazon, Walmart, and verified retailers.
          </p>
        </div>

        {/* Safety Guardrail Guarantee */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero Credential Storage Guarantee</span>
          </div>
          <p className="text-[11px] text-indigo-200/80 leading-relaxed">
            DealHunter never asks for or stores credit card numbers, passwords, or retailer accounts. Purchasing is prepared safely by opening the retailer checkout link with your explicit confirmation.
          </p>
        </div>
      </div>

      {/* Purchases Queue & History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Staged & Recorded Purchases
        </h3>

        {purchases.map((p) => {
          const isPending = p.status === 'prepared' || p.status === 'opened_retailer';
          return (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isPending
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : p.status === 'user_confirmed'
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-amber-300">{p.retailer}</span>
                  <span className="text-[11px] text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(p.preparedAt).toLocaleDateString()} {new Date(p.preparedAt).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'user_confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p.status === 'user_confirmed' ? 'Confirmed' : isPending ? 'Awaiting Checkout' : 'Cancelled'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{p.productName}</h4>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-400">${p.price.toFixed(2)}</span>
                  {p.originalPrice && (
                    <span className="text-slate-500 line-through">${p.originalPrice.toFixed(2)}</span>
                  )}
                  {p.discountPercentage && (
                    <span className="text-rose-400 font-bold">-{p.discountPercentage}%</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {isPending && (
                  <>
                    <a
                      href={p.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Checkout at Retailer</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onConfirmPurchase(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                      title="Mark as confirmed purchased"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onCancelPurchase(p.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="Cancel purchase"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}

                {p.status === 'user_confirmed' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Purchase Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {purchases.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No purchase records or staged deals yet. Deals matching auto-buy rules or marked as purchased will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
