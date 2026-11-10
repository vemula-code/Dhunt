import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Apple, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already installed in standalone mode, show clean installed status
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" />
        <span>Installed</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 text-xs font-black shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
        title="Install DealHunter on home screen"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer"
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                <p>1. Tap the <strong>Share</strong> button at bottom of Safari.</p>
                <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                <p>3. Tap <strong>Add</strong> in top right corner.</p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default browser prompt fallback button
  return (
    <button
      onClick={() => {
        alert('To install DealHunter on your device:\n\n• Chrome/Edge: Click the install icon in your address bar or menu > Install App.\n• Mobile Safari: Tap Share > Add to Home Screen.');
      }}
      className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
      title="Install DealHunter on your device"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Install App</span>
    </button>
  );
};
