import React from 'react';
import { AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Flame,
  Radio,
  Smartphone,
  Sparkles,
  Zap,
  Bookmark,
  Bell,
  Settings as SettingsIcon,
  PlusCircle,
} from 'lucide-react';

export type SimpleNavTab = 'deals' | 'saved' | 'feed_log' | 'connect';

interface HeaderProps {
  currentTab: SimpleNavTab;
  onTabChange: (tab: SimpleNavTab) => void;
  settings: AppSettings;
  onToggleMonitoring: () => void;
  onOpenAndroidModal: () => void;
  onOpenManualIngest: () => void;
  onSimulateBurst: () => void;
  criticalCount: number;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  settings,
  onToggleMonitoring,
  onOpenAndroidModal,
  onOpenManualIngest,
  onSimulateBurst,
  criticalCount,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={() => onTabChange('deals')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-emerald-400 p-[1.5px] shadow-md shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">
                Deal<span className="text-amber-400">Hunter</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                AI Radar
              </span>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          {/* 1-Tap Simulation */}
          <button
            onClick={onSimulateBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition active:scale-95 shadow-sm cursor-pointer"
            title="Simulate incoming deal from X"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Deal</span>
          </button>

          {/* Paste Tweet */}
          <button
            onClick={onOpenManualIngest}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paste Tweet</span>
          </button>

          {/* Android Connect Button */}
          <button
            onClick={onOpenAndroidModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-xs font-semibold text-indigo-200 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phone Sync</span>
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Clean Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 border-t border-slate-800/60">
        <nav className="flex space-x-2 py-2 text-xs font-semibold">
          <button
            onClick={() => onTabChange('deals')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              currentTab === 'deals'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>All Deals</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white animate-pulse">
                {criticalCount} Glitches
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('saved')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              currentTab === 'saved'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Saved ({savedCount})</span>
          </button>

          <button
            onClick={() => onTabChange('feed_log')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              currentTab === 'feed_log'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Captured Tweets</span>
          </button>

          <button
            onClick={() => onTabChange('connect')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              currentTab === 'connect'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>How Phone Sync Works</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
