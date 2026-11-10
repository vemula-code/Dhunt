import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Zap, Sparkles, Volume2, VolumeX, Smartphone } from 'lucide-react';

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
                ? 'bg-slate-900 border-slate-750 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Phone Sync Modal Trigger */}
          <button
            onClick={onOpenPhoneModal}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            title="How phone notification syncing works"
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
