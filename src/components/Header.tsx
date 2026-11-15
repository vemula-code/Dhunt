import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { notifier } from '../services/notifier';
import { Zap, Sparkles, Volume2, VolumeX, Smartphone, BellRing } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-emerald-400 p-[1.5px] shadow-md shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-white">DealHunter</span>
              {glitchCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  🚨 {glitchCount} SIREN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prominent Top Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent PWA Install Button at Top */}
          <PWAInstallButton />

          {/* Enable Mobile Alert Notifications if not granted */}
          {notifPermission === 'default' && (
            <button
              onClick={handleRequestAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              title="Allow DealHunter to send urgent deal alerts"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enable Alerts</span>
            </button>
          )}

          {/* 1-Tap Simulate Deal */}
          <button
            onClick={onSimulateDeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
            title="Simulate incoming deal from X"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Simulate Deal</span>
            <span className="sm:hidden">Simulate</span>
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

          {/* Phone Sync Modal Trigger */}
          <button
            onClick={onOpenPhoneModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            title="Mobile permissions & X notification sync setup"
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Mobile Setup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
