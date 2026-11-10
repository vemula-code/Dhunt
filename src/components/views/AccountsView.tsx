import React, { useState } from 'react';
import { XAccount } from '../../types';
import { Users, Star, VolumeX, Volume2, Plus, Trash2, ShieldCheck, Flame, Zap, Info } from 'lucide-react';

interface AccountsViewProps {
  accounts: XAccount[];
  onSaveAccount: (account: XAccount) => Promise<void>;
  onDeleteAccount: (username: string) => Promise<void>;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onSaveAccount,
  onDeleteAccount,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newIsTrusted, setNewIsTrusted] = useState(true);
  const [newPriorityModifier, setNewPriorityModifier] = useState(10);
  const [newNotes, setNewNotes] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    let handle = newUsername.trim();
    if (!handle.startsWith('@')) handle = '@' + handle;

    const account: XAccount = {
      username: handle,
      displayName: newDisplayName.trim() || handle.replace('@', ''),
      isTrusted: newIsTrusted,
      isMuted: false,
      priorityModifier: Number(newPriorityModifier),
      totalDeals: 0,
      criticalDeals: 0,
      notes: newNotes.trim() || undefined,
    };

    await onSaveAccount(account);
    setNewUsername('');
    setNewDisplayName('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleToggleTrusted = async (acc: XAccount) => {
    await onSaveAccount({ ...acc, isTrusted: !acc.isTrusted });
  };

  const handleToggleMuted = async (acc: XAccount) => {
    await onSaveAccount({ ...acc, isMuted: !acc.isMuted });
  };

  const handleModifierChange = async (acc: XAccount, delta: number) => {
    const nextVal = Math.max(-20, Math.min(20, acc.priorityModifier + delta));
    await onSaveAccount({ ...acc, priorityModifier: nextVal });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Followed Deal Accounts</h2>
            <p className="text-xs text-slate-400">
              Manage accounts, configure trust levels, score modifiers, and mute noisy accounts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add X Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.username}
            className={`p-5 rounded-2xl border transition space-y-4 flex flex-col justify-between ${
              acc.isMuted
                ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                : acc.isTrusted
                ? 'bg-slate-900/90 border-amber-500/30'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{acc.displayName}</h3>
                    {acc.isTrusted && (
                      <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="Trusted Deal Account">
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-amber-300/80">{acc.username}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleTrusted(acc)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      acc.isTrusted
                        ? 'text-amber-400 bg-amber-500/20'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={acc.isTrusted ? 'Mark as untrusted' : 'Mark as trusted (+10 score)'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleToggleMuted(acc)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      acc.isMuted
                        ? 'text-rose-400 bg-rose-500/20'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={acc.isMuted ? 'Unmute account' : 'Mute account notifications'}
                  >
                    {acc.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onDeleteAccount(acc.username)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Remove account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {acc.notes && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {acc.notes}
                </p>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Deals</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {acc.totalDeals}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Critical Glitches</span>
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {acc.criticalDeals}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Modifier Adjuster */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Priority Score Modifier:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleModifierChange(acc, -5)}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className={`font-mono font-bold px-1.5 ${
                  acc.priorityModifier > 0 ? 'text-emerald-400' : acc.priorityModifier < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {acc.priorityModifier > 0 ? `+${acc.priorityModifier}` : acc.priorityModifier}
                </span>
                <button
                  onClick={() => handleModifierChange(acc, 5)}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Notice Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-200">Regarding the Official X (Twitter) API</h4>
          <p>
            DealHunter is purposefully engineered to operate with zero monthly subscription fees by reading Android notifications delivered by the official X app via Android NotificationListenerService. Direct programmatic monitoring via the official X API requires enterprise/paid developer tiers ($100+/mo). This architecture saves operating costs while still catching fast deals within seconds.
          </p>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add New X Deal Account</h3>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">X Username Handle</label>
                <input
                  type="text"
                  placeholder="@DealAccount"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wario64 Deals"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Priority Score Modifier (-20 to +20)</label>
                <input
                  type="number"
                  min="-20"
                  max="20"
                  value={newPriorityModifier}
                  onChange={(e) => setNewPriorityModifier(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trustedCheck"
                  checked={newIsTrusted}
                  onChange={(e) => setNewIsTrusted(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-800"
                />
                <label htmlFor="trustedCheck" className="text-slate-300 font-medium cursor-pointer">
                  Mark as Trusted Deal Account (+10 scoring bonus)
                </label>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Notes / Specialization</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Known for Amazon pricing errors and console restocks"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
