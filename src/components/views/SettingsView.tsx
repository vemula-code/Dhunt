import React, { useState } from 'react';
import { AppSettings, ScoringWeights, PriorityLevel } from '../../types';
import { notifier } from '../../services/notifier';
import { dbService } from '../../services/db';
import {
  Settings as SettingsIcon,
  Volume2,
  Vibrate,
  Sliders,
  Sparkles,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Check,
  RefreshCw,
  Bell,
  Key,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  onDataImported: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataImported,
}) => {
  const [weights, setWeights] = useState<ScoringWeights>(settings.scoringWeights);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveWeights = async () => {
    const updated: AppSettings = {
      ...settings,
      scoringWeights: weights,
    };
    await onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleSound = async () => {
    const updated: AppSettings = { ...settings, alertSound: !settings.alertSound };
    await onUpdateSettings(updated);
    if (updated.alertSound) {
      notifier.playAlertSound('critical');
    }
  };

  const handleToggleVibrate = async () => {
    const updated: AppSettings = { ...settings, alertVibrate: !settings.alertVibrate };
    await onUpdateSettings(updated);
    if (updated.alertVibrate) {
      notifier.vibrate('critical');
    }
  };

  const handleTestSound = (priority: PriorityLevel) => {
    notifier.playAlertSound(priority);
  };

  const handleTestVibrate = (priority: PriorityLevel) => {
    notifier.vibrate(priority);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const json = await dbService.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dealhunter-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await dbService.importData(content);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count} records!`);
        await onDataImported();
      } else {
        setImportStatus(`Import failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to delete all stored deals, rules, and history? This cannot be undone.')) {
      await dbService.clearAllData();
      await onDataImported();
      alert('Local database wiped clean.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Platform Settings & Scoring Logic</h2>
          <p className="text-xs text-slate-400">
            Customize deal scoring weights, urgency audio alerts, AI intelligence, and local backups.
          </p>
        </div>
      </div>

      {/* Priority Scoring Engine Weights */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Deal Priority Scoring Weights (0–100 Engine)</h3>
          </div>
          <button
            onClick={handleSaveWeights}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saveSuccess ? 'Saved!' : 'Save Weights'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Tune the algorithmic weight bonuses assigned to captured deals. Deals with score 90+ are marked Critical.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Potential Pricing Glitch Bonus</span>
              <span className="text-rose-400 font-mono">+{weights.pricingGlitch}</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={weights.pricingGlitch}
              onChange={(e) => handleWeightChange('pricingGlitch', parseInt(e.target.value, 10))}
              className="w-full accent-rose-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Discount Above 80% Bonus</span>
              <span className="text-amber-400 font-mono">+{weights.discount80}</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={weights.discount80}
              onChange={(e) => handleWeightChange('discount80', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Discount Above 60% Bonus</span>
              <span className="text-amber-400 font-mono">+{weights.discount60}</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={weights.discount60}
              onChange={(e) => handleWeightChange('discount60', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Limited-Time / Lightning Window</span>
              <span className="text-orange-400 font-mono">+{weights.limitedTime}</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={weights.limitedTime}
              onChange={(e) => handleWeightChange('limitedTime', parseInt(e.target.value, 10))}
              className="w-full accent-orange-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Known Trusted Account Bonus</span>
              <span className="text-emerald-400 font-mono">+{weights.trustedAccount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={weights.trustedAccount}
              onChange={(e) => handleWeightChange('trustedAccount', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between font-semibold text-slate-200">
              <span>Coupon / Promo Code Bonus</span>
              <span className="text-emerald-400 font-mono">+{weights.coupon}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={weights.coupon}
              onChange={(e) => handleWeightChange('coupon', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Urgent Audio & Haptic Alerts */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Urgent Alerts, Audio Chimes & Haptics</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Sound Toggle & Test */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">Synthesized Audio Alerts</span>
              </div>
              <button
                onClick={handleToggleSound}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.alertSound ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    settings.alertSound ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-slate-400 text-[11px]">
              Crisp Web Audio frequencies without external audio file latency.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleTestSound('critical')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium transition cursor-pointer"
              >
                Test Critical Alarm
              </button>
              <button
                onClick={() => handleTestSound('excellent')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition cursor-pointer"
              >
                Test Chime
              </button>
            </div>
          </div>

          {/* Vibration Toggle */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Device Vibration</span>
              </div>
              <button
                onClick={handleToggleVibrate}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.alertVibrate ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    settings.alertVibrate ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-slate-400 text-[11px]">
              Hardware vibration patterns for urgent price glitch detection on mobile.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleTestVibrate('critical')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
              >
                Test Vibration Pattern
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Deal Intelligence Setting */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">AI Deal Intelligence (Gemini 3.8 Flash)</h3>
          </div>
          <button
            onClick={async () => {
              const updated: AppSettings = { ...settings, useGeminiAI: !settings.useGeminiAI };
              await onUpdateSettings(updated);
            }}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              settings.useGeminiAI ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                settings.useGeminiAI ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          When enabled, the server uses Gemini 3.8 Flash to extract ambiguous product titles, verify pricing anomalies, and assign confidence ratings. When disabled or offline, DealHunter automatically runs its instant local regex/NLP parser with zero network latency and $0 operating cost.
        </p>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Estimated API cost per deal analysis:</span>
          <span className="text-emerald-400 font-bold">~$0.000042 USD</span>
        </div>
      </div>

      {/* Backup, Export & Factory Reset */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Local Data Backup, Export & Restore
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={handleClearData}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 border border-rose-500/30 transition flex items-center gap-2 ml-auto cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Local Database</span>
          </button>
        </div>

        {importStatus && (
          <p className="text-xs text-amber-400 pt-1 font-mono">{importStatus}</p>
        )}
      </div>
    </div>
  );
};
