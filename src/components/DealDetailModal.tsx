import React, { useState } from 'react';
import { Deal } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../services/intelligence';
import {
  X,
  ExternalLink,
  Bookmark,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Zap,
  ShoppingBag,
  Flag,
  Sparkles,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';

interface DealDetailModalProps {
  deal: Deal | null;
  onClose: () => void;
  onToggleSave: (dealId: string) => void;
  onDismiss: (dealId: string) => void;
  onMarkPurchased: (deal: Deal) => void;
  onReportIncorrect: (dealId: string) => void;
  onUpdateDeal: (deal: Deal) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  deal,
  onClose,
  onToggleSave,
  onDismiss,
  onMarkPurchased,
  onReportIncorrect,
  onUpdateDeal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  if (!deal) return null;

  const isGlitch = deal.category === 'price_error' || deal.product.isPricingGlitch;
  const catConfig = CATEGORY_LABELS[deal.category] || CATEGORY_LABELS.regular_discount;
  const prioConfig = PRIORITY_CONFIG[deal.priority];

  const handleCopyLink = () => {
    if (deal.product.productUrl) {
      navigator.clipboard.writeText(deal.product.productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyLink = async () => {
    if (!deal.product.productUrl) return;
    setIsVerifying(true);
    setVerifyMessage(null);

    try {
      const res = await fetch('/api/verify-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: deal.product.productUrl }),
      });

      const data = await res.json();
      const updatedDeal: Deal = {
        ...deal,
        verificationStatus: data.status || (data.isReachable ? 'verified_active' : 'expired_oos'),
        verificationDetails: data.message,
      };
      onUpdateDeal(updatedDeal);
      setVerifyMessage(data.message);
    } catch (err) {
      setVerifyMessage('Failed to connect to verification service.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Glowing top line for glitches */}
        {isGlitch && (
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catConfig.bg} ${catConfig.color}`}>
                {isGlitch && <Zap className="w-3.5 h-3.5 inline mr-1 text-rose-400" />}
                {catConfig.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {deal.product.retailer}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${prioConfig.badgeColor}`}>
                Score: {deal.score}/100 • {prioConfig.label}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white pt-1">
              {deal.product.productName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-3 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Price & Savings Highlight Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div>
              <p className="text-xs text-slate-400">Current Deal Price</p>
              <p className="text-2xl font-black text-emerald-400">
                {deal.product.dealPrice !== null ? `$${deal.product.dealPrice.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Original Price</p>
              <p className="text-lg font-semibold text-slate-400 line-through">
                {deal.product.originalPrice !== null ? `$${deal.product.originalPrice.toFixed(2)}` : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Savings</p>
              <p className="text-lg font-bold text-amber-400">
                {deal.product.originalPrice !== null && deal.product.dealPrice !== null
                  ? `$${(deal.product.originalPrice - deal.product.dealPrice).toFixed(2)}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Discount</p>
              <p className="text-lg font-bold text-rose-400">
                {deal.product.discountPercentage ? `-${deal.product.discountPercentage}%` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Product Extracted Attributes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Extracted Deal Attributes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Brand</span>
                <span className="font-semibold text-slate-200">{deal.product.brand || 'Unspecified'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-200">{deal.product.productCategory}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Pricing Glitch?</span>
                <span className={`font-semibold ${isGlitch ? 'text-rose-400' : 'text-slate-400'}`}>
                  {isGlitch ? 'YES (High Priority Error)' : 'No (Standard Deal)'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Stock Status</span>
                <span className="font-semibold text-slate-200 capitalize">{deal.product.stockStatus.replace('_', ' ')}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Shipping</span>
                <span className="font-semibold text-slate-200">{deal.product.shippingInfo || 'Standard'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400 block">Coupon Code</span>
                <span className="font-semibold text-emerald-400">{deal.product.couponCode || 'None required'}</span>
              </div>
            </div>
          </div>

          {/* Transparent Scoring Engine Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Score Calculation Breakdown ({deal.score}/100)
              </h4>
              <span className="text-[11px] text-slate-400">Priority: {prioConfig.label}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {deal.scoreReasons.map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI / Classification Intelligence Engine Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 block">Intelligence Classifier</span>
              <span className="font-medium text-slate-200">
                {deal.aiClassified ? `Gemini AI (${deal.aiModelUsed || 'gemini-3.8-flash'})` : 'Local Fast Regex/NLP Engine'}
              </span>
              {deal.aiCostEstimate !== null && deal.aiCostEstimate !== undefined && (
                <span className="text-[10px] text-slate-500 block">
                  Est. Analysis Cost: ${deal.aiCostEstimate.toFixed(6)} • Privacy-safe
                </span>
              )}
            </div>
            <button
              onClick={() => onReportIncorrect(deal.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{deal.userReportedIncorrect ? 'Reported' : 'Report Classification'}</span>
            </button>
          </div>

          {/* Verification Status & Link Checker */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Retailer Link Verification
                </span>
              </div>
              <button
                onClick={handleVerifyLink}
                disabled={isVerifying || !deal.product.productUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Checking...' : 'Verify Now'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {verifyMessage || deal.verificationDetails || 'Status: ' + deal.verificationStatus.replace('_', ' ')}
            </p>
          </div>

          {/* Original X Notification Raw Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Original Captured X Notification
              </h4>
              <span className="text-[11px] text-slate-400">
                From {deal.sourceAccount} • {new Date(deal.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
              {deal.rawNotificationText}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleSave(deal.id)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                deal.isSaved ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Save / Bookmark deal"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Copy product link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                onDismiss(deal.id);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss deal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {deal.originalPostUrl && (
              <a
                href={deal.originalPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition"
              >
                View on X
              </a>
            )}

            <button
              onClick={() => onMarkPurchased(deal)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Mark Purchased</span>
            </button>

            {deal.product.productUrl && (
              <a
                href={deal.product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
                  isGlitch ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <span>Go to Retailer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
