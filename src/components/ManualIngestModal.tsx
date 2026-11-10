import React, { useState } from 'react';
import { XAccount } from '../types';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';

interface ManualIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: XAccount[];
  onIngest: (title: string, rawText: string, sourceAccount: string, postUrl: string | null) => Promise<void>;
}

export const ManualIngestModal: React.FC<ManualIngestModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onIngest,
}) => {
  const [sourceAccount, setSourceAccount] = useState('@BobaDeals');
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickPreset = (presetType: 'glitch' | 'clearance' | 'coupon') => {
    if (presetType === 'glitch') {
      setTitle('🚨 GLITCH: Bose QuietComfort 45 Headphones');
      setRawText('🚨 PRICE ERROR at Amazon: Bose QuietComfort 45 Bluetooth Wireless Noise Cancelling Headphones down to $49.00 (was $329.00)! 85% OFF! Run, will cancel! amzn.to/bose-glitch');
      setSourceAccount('@BobaDeals');
      setPostUrl('https://x.com/BobaDeals/status/178949182');
    } else if (presetType === 'clearance') {
      setTitle('Walmart Clearance: Apple iPad 10th Gen');
      setRawText('Walmart In-Store & Online Clearance: Apple iPad 10.9-inch (10th Gen, 64GB, Wi-Fi) down to $199.00 (Retail $349.00). Limited stock remaining! walmart.com/ip/ipad-10');
      setSourceAccount('@FatKidDeals');
      setPostUrl('https://x.com/FatKidDeals/status/178949183');
    } else {
      setTitle('Best Buy: WD_BLACK 4TB SN850X NVMe SSD');
      setRawText('Best Buy has WD_BLACK 4TB SN850X NVMe Internal Gaming SSD for $229.99 with coupon code WDSAVE30 at checkout (Reg. $379.99). bestbuy.com/site/wd-sn850x-4tb');
      setSourceAccount('@Wario64');
      setPostUrl('https://x.com/Wario64/status/178949184');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !title.trim()) {
      setError('Please provide at least a title or notification text.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onIngest(
        title.trim() || 'X Deal Notification',
        rawText.trim(),
        sourceAccount,
        postUrl.trim() || null
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Ingest Test Deal Notification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Quick Test Presets:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset('glitch')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition text-xs font-medium cursor-pointer"
              >
                🚨 85% Price Glitch
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('clearance')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-medium cursor-pointer"
              >
                🏷️ iPad Clearance
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('coupon')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition text-xs font-medium cursor-pointer"
              >
                🎟️ SSD Promo Code
              </button>
            </div>
          </div>

          {/* Source Account */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Source X Account
            </label>
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.username} value={acc.username}>
                  {acc.username} ({acc.displayName}) {acc.isTrusted ? '⭐ Trusted' : ''}
                </option>
              ))}
              <option value="@OtherDealHunter">@OtherDealHunter</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Notification Title
            </label>
            <input
              type="text"
              placeholder="e.g. 🚨 PRICE GLITCH at Amazon!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Raw Text */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Full Notification Text
            </label>
            <textarea
              rows={4}
              placeholder="Paste exact notification copy including retailer, prices, and links..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-200 text-xs focus:border-amber-400 focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Post URL */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              X Post URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://x.com/.../status/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Analyzing...' : 'Ingest & Analyze'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
