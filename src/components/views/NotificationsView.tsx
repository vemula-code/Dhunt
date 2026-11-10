import React, { useState } from 'react';
import { CapturedNotification } from '../../types';
import { Bell, RefreshCw, CheckCircle2, CopyX, AlertCircle, Clock, Search, ExternalLink } from 'lucide-react';

interface NotificationsViewProps {
  notifications: CapturedNotification[];
  onReprocess: (notification: CapturedNotification) => Promise<void>;
  onClearAllNotifications: () => Promise<void>;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onReprocess,
  onClearAllNotifications,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const filtered = notifications.filter((n) => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.rawText.toLowerCase().includes(q) ||
        n.sourceAccount.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReprocessClick = async (notif: CapturedNotification) => {
    setReprocessingId(notif.id);
    try {
      await onReprocess(notif);
    } finally {
      setReprocessingId(null);
    }
  };

  const getStatusBadge = (status: CapturedNotification['status']) => {
    switch (status) {
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Processed
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <CopyX className="w-3 h-3" />
            Duplicate
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" />
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">All Ingested Notifications</h2>
            <p className="text-xs text-slate-400">
              Raw feed of captured X notifications, processing statuses, and duplicate records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="processed">Processed</option>
            <option value="duplicate">Duplicate</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Notifications Table / Cards */}
      <div className="space-y-3">
        {filtered.map((notif) => (
          <div
            key={notif.id}
            className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-xs text-amber-300">
                  {notif.sourceAccount}
                </span>
                <span className="text-[11px] text-slate-500">•</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(notif.receivedAt).toLocaleTimeString()}
                </span>
                {getStatusBadge(notif.status)}
                {notif.isSimulated && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">
                    Simulated
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                {notif.title}
              </h4>

              <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-relaxed">
                {notif.rawText}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              {notif.postUrl && (
                <a
                  href={notif.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                  title="View original on X"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={() => handleReprocessClick(notif)}
                disabled={reprocessingId === notif.id}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reprocessingId === notif.id ? 'animate-spin' : ''}`} />
                <span>Reprocess</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No notifications matching current criteria.
          </div>
        )}
      </div>
    </div>
  );
};
