import React, { useState } from 'react';
import { CustomRule, DealCategory } from '../../types';
import { Sliders, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, Tag, ShoppingBag, EyeOff } from 'lucide-react';

interface RulesViewProps {
  rules: CustomRule[];
  onSaveRule: (rule: CustomRule) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}

export const RulesView: React.FC<RulesViewProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minDiscount, setMinDiscount] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [includedKw, setIncludedKw] = useState('');
  const [excludedKw, setExcludedKw] = useState('');
  const [action, setAction] = useState<CustomRule['action']>('notify_critical');

  const availableRetailers = ['Amazon', 'Walmart', 'Best Buy', 'Target', 'Newegg', 'B&H Photo'];
  const availableCategories = ['Electronics', 'Gaming', 'Computers', 'Home & Kitchen', 'Apparel', 'Tools'];

  const handleToggleRetailer = (ret: string) => {
    setSelectedRetailers((prev) =>
      prev.includes(ret) ? prev.filter((r) => r !== ret) : [...prev, ret]
    );
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const newRule: CustomRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      enabled: true,
      retailers: selectedRetailers,
      categories: selectedCategories,
      dealTypes: action === 'notify_critical' ? ['price_error'] : [],
      minDiscount: minDiscount ? parseInt(minDiscount, 10) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      trustedAccountsOnly: trustedOnly,
      includedKeywords: includedKw.split(',').map((s) => s.trim()).filter(Boolean),
      excludedKeywords: excludedKw.split(',').map((s) => s.trim()).filter(Boolean),
      action,
      createdAt: Date.now(),
    };

    await onSaveRule(newRule);
    // Reset
    setRuleName('');
    setSelectedRetailers([]);
    setSelectedCategories([]);
    setMinDiscount('');
    setMaxPrice('');
    setIncludedKw('');
    setExcludedKw('');
    setShowAddModal(false);
  };

  const handleToggleEnable = async (rule: CustomRule) => {
    await onSaveRule({ ...rule, enabled: !rule.enabled });
  };

  const getActionBadge = (act: CustomRule['action']) => {
    switch (act) {
      case 'notify_critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Instant Critical Alert
          </span>
        );
      case 'auto_prepare_purchase':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            Auto-Prepare Purchase
          </span>
        );
      case 'ignore':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <EyeOff className="w-3.5 h-3.5" />
            Silently Ignore
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Standard Alert
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Sliders className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Custom Deal Rules</h2>
            <p className="text-xs text-slate-400">
              Configure automated actions based on retailer, price ceiling, minimum discount %, and keywords.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Deal Rule</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition space-y-3 ${
              rule.enabled
                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/50 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleEnable(rule)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    rule.enabled ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <div>
                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {getActionBadge(rule.action)}
                    {rule.minDiscount && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Min {rule.minDiscount}% OFF
                      </span>
                    )}
                    {rule.maxPrice && (
                      <span className="text-[11px] text-amber-300 font-medium">
                        Under ${rule.maxPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteRule(rule.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition self-end sm:self-center cursor-pointer"
                title="Delete rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Rule Criteria Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              {rule.retailers.length > 0 ? (
                rule.retailers.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                    Retailer: {r}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 text-[11px]">
                  All Retailers
                </span>
              )}

              {rule.categories.length > 0 &&
                rule.categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                    Category: {c}
                  </span>
                ))}

              {rule.includedKeywords.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 text-[11px]">
                  Contains: {rule.includedKeywords.join(', ')}
                </span>
              )}

              {rule.excludedKeywords.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-500/30 text-[11px]">
                  Excludes: {rule.excludedKeywords.join(', ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-white">Create New Custom Deal Rule</h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Electronics 60%+ Off"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Action */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Action When Matched</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as CustomRule['action'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="notify_critical">🚨 Elevate to Critical & Alert Immediately</option>
                  <option value="notify_normal">🔔 Standard Notification Alert</option>
                  <option value="auto_prepare_purchase">🛒 Auto-Prepare Purchase Opportunity</option>
                  <option value="ignore">🔇 Ignore / Dismiss Silently</option>
                </select>
              </div>

              {/* Retailers */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-semibold">Retailers (Leave empty for any)</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableRetailers.map((ret) => {
                    const isSelected = selectedRetailers.includes(ret);
                    return (
                      <button
                        type="button"
                        key={ret}
                        onClick={() => handleToggleRetailer(ret)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {ret}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-semibold">Categories (Leave empty for any)</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Min discount & Max price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Min Discount %</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="e.g. 50"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Max Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Must Contain Keywords (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. oled, airpods, nvme"
                  value={includedKw}
                  onChange={(e) => setIncludedKw(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Exclude Keywords (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. refurbished, used, case"
                  value={excludedKw}
                  onChange={(e) => setExcludedKw(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
