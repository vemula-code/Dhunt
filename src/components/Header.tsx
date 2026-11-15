import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { notifier } from '../services/notifier';
import { Zap, Sparkles, Volume2, VolumeX, Smartphone, BellRing, Copy, Check } from 'lucide-react';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSimulateDeal: () => void;
  onOpenPhoneModal: () => void;
  totalDealsCount: number;
  glitchCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onSimulateDeal,
  onOpenPhoneModal,
  totalDealsCount,
  glitchCount,
}) => {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestAlerts = async () => {
    const perm = await notifier.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      notifier.playAlertSound('excellent');
    }
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = `${origin}/api/notifications/ingest`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-emerald-400 p-[1.5px] shadow-md shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-white">DealHunter</span>
            {glitchCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500 text-white animate-pulse">
                🚨 {glitchCount}
              </span>
            )}
          </div>
        </div>

        {/* Prominent Top Action Buttons - All Visible on Mobile */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Prominent PWA Install Button */}
          <PWAInstallButton />

          {/* Enable Mobile Alert Notifications if not granted */}
          {notifPermission === 'default' && (
            <button
              onClick={handleRequestAlerts}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              title="Allow DealHunter to send urgent deal alerts"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Alerts</span>
            </button>
          )}

          {/* 1-Tap Simulate Deal */}
          <button
            onClick={onSimulateDeal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
            title="Simulate incoming deal from X"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Simulate</span>
          </button>

          {/* 1-Tap Copy Webhook URL directly from top bar */}
          <button
            onClick={handleCopyWebhook}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer"
            title="Copy your webhook URL (/api/notifications/ingest)"
          >
            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedWebhook ? 'Copied URL!' : 'Copy Webhook'}</span>
          </button>

          {/* Mobile Setup Modal Trigger - Always Labeled */}
          <button
            onClick={onOpenPhoneModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition cursor-pointer"
            title="Mobile permissions & X notification sync setup"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mobile Setup</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
