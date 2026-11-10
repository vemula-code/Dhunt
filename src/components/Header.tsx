import React from 'react';
import { AppSettings, PriorityLevel } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Flame,
  Radio,
  PlusCircle,
  Smartphone,
  Sparkles,
  Zap,
  Bookmark,
  Bell,
  Users,
  Sliders,
  ShoppingBag,
  Settings as SettingsIcon,
  Play,
  Pause,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'live_deals'
  | 'critical'
  | 'saved'
  | 'notifications'
  | 'accounts'
  | 'rules'
  | 'purchases'
  | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  settings: AppSettings;
  onToggleMonitoring: () => void;
  onOpenAndroidModal: () => void;
  onOpenManualIngest: () => void;
  onSimulateBurst: () => void;
  criticalCount: number;
  savedCount: number;
  queueCount: number;
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
  queueCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'live_deals', label: 'Live Deals', icon: <Flame className="w-4 h-4" /> },
    {
      id: 'critical',
      label: 'Critical Deals',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
      badge: criticalCount,
    },
    {
      id: 'saved',
      label: 'Saved Deals',
      icon: <Bookmark className="w-4 h-4" />,
      badge: savedCount,
    },
    {
      id: 'notifications',
      label: 'All Notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    { id: 'accounts', label: 'X Accounts', icon: <Users className="w-4 h-4" /> },
    { id: 'rules', label: 'My Rules', icon: <Sliders className="w-4 h-4" /> },
    { id: 'purchases', label: 'Auto-Buy & History', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  Deal<span className="text-amber-400">Hunter</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
                Personal Deal Intelligence & Glitch Monitor
              </p>
            </div>
          </div>

          {/* Monitoring State Badge */}
          <button
            onClick={onToggleMonitoring}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
              settings.autoMonitoring
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Click to toggle monitoring"
          >
            <Radio className={`w-3 h-3 ${settings.autoMonitoring ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
            <span>{settings.autoMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Simulate Burst */}
          <button
            onClick={onSimulateBurst}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition shadow-sm cursor-pointer"
            title="Generate realistic test notifications"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Burst</span>
          </button>

          {/* Test Manual Ingest */}
          <button
            onClick={onOpenManualIngest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition shadow-sm cursor-pointer"
            title="Paste custom X notification text"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ingest Deal</span>
          </button>

          {/* Android Companion Connector */}
          <button
            onClick={onOpenAndroidModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition shadow-sm cursor-pointer"
            title="Configure Android NotificationListenerService"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Android Sync</span>
          </button>

          {/* In-app PWA install button */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5 text-xs font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      item.id === 'critical'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
