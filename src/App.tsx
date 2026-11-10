import React, { useState, useEffect, useCallback } from 'react';
import {
  Deal,
  CapturedNotification,
  XAccount,
  CustomRule,
  AppSettings,
} from './types';
import { dbService, DEFAULT_SETTINGS } from './services/db';
import { extractDealLocally, extractDealWithAI } from './services/intelligence';
import { evaluateCustomRules } from './services/rulesEngine';
import { notifier } from './services/notifier';
import { generateSimulatedNotification } from './services/simulatedFeed';
import { Header } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { AndroidCompanionModal } from './components/AndroidCompanionModal';
import { ExternalLink, X, Zap } from 'lucide-react';

export default function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [notifications, setNotifications] = useState<CapturedNotification[]>([]);
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [urgentToast, setUrgentToast] = useState<Deal | null>(null);

  // Load all initial data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [dList, nList, aList, rList, sData] = await Promise.all([
        dbService.getDeals(),
        dbService.getNotifications(),
        dbService.getAccounts(),
        dbService.getRules(),
        dbService.getSettings(),
      ]);

      setDeals(dList);
      setNotifications(nList);
      setAccounts(aList);
      setRules(rList);
      if (sData) setSettings(sData);
    } catch (err) {
      console.error('Failed to load local database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Process a newly arrived notification through the DealHunter pipeline
  const processNotification = useCallback(
    async (rawNotif: CapturedNotification) => {
      // 1. Check duplicate
      const isDuplicate = await dbService.checkDuplicateNotification(
        rawNotif.rawText,
        rawNotif.sourceAccount
      );

      if (isDuplicate) {
        const dupNotif: CapturedNotification = { ...rawNotif, status: 'duplicate' };
        await dbService.saveNotification(dupNotif);
        return null;
      }

      await dbService.saveNotification(rawNotif);

      // 2. Deal Extraction
      let parseResult;
      if (settings.useGeminiAI) {
        parseResult = await extractDealWithAI(rawNotif, accounts, settings.scoringWeights);
      } else {
        parseResult = extractDealLocally(rawNotif, accounts, settings.scoringWeights);
      }

      // 3. Construct Deal Record
      const dealId = `deal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let newDeal: Deal = {
        id: dealId,
        notificationId: rawNotif.id,
        sourceAccount: rawNotif.sourceAccount,
        rawNotificationText: rawNotif.rawText,
        originalPostUrl: rawNotif.postUrl,
        product: parseResult.product,
        category: parseResult.category,
        score: parseResult.score,
        priority: parseResult.priority,
        scoreReasons: parseResult.scoreReasons,
        aiClassified: parseResult.aiClassified,
        verificationStatus: 'not_verified',
        isSaved: false,
        isDismissed: false,
        isViewed: false,
        createdAt: Date.now(),
      };

      // 4. Custom Rules
      const ruleEvaluation = evaluateCustomRules(newDeal, rules, accounts);
      if (ruleEvaluation.matchedRule) {
        if (ruleEvaluation.actionTaken === 'ignore') {
          newDeal.isDismissed = true;
        } else if (ruleEvaluation.actionTaken === 'elevated_critical') {
          newDeal.score = 98;
          newDeal.priority = 'critical';
        }
      }

      await dbService.saveDeal(newDeal);
      setDeals((prev) => [newDeal, ...prev.filter((d) => d.id !== newDeal.id)]);

      // 5. Sound Alert & Toast if not dismissed
      if (!newDeal.isDismissed) {
        notifier.sendUrgentAlert(
          newDeal,
          settings.alertSound,
          settings.alertVibrate,
          'good'
        );

        if (newDeal.priority === 'critical' || newDeal.category === 'price_error' || (newDeal.product.discountPercentage && newDeal.product.discountPercentage >= 70)) {
          setUrgentToast(newDeal);
        }
      }

      return newDeal;
    },
    [accounts, rules, settings]
  );

  // Background polling for server webhook ingestion
  useEffect(() => {
    if (!settings.autoMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications/pending');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          for (const item of data.notifications) {
            await processNotification({
              id: item.id,
              sourceAccount: item.sourceAccount,
              title: item.title,
              rawText: item.rawText,
              postUrl: item.postUrl,
              receivedAt: item.receivedAt || Date.now(),
              status: 'queued',
              isSimulated: item.isSimulated || false,
              dealId: null,
            });
          }
        }
      } catch (err) {
        // quiet catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [settings.autoMonitoring, processNotification]);

  // Dismiss a deal ("Not interested for this time")
  const handleDismiss = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const updated = { ...deal, isDismissed: true };
    await dbService.saveDeal(updated);
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    if (urgentToast?.id === dealId) setUrgentToast(null);
  };

  // Toggle sound
  const handleToggleSound = async () => {
    const updated = { ...settings, alertSound: !settings.alertSound };
    await dbService.saveSettings(updated);
    setSettings(updated);
    if (updated.alertSound) {
      notifier.playAlertSound('critical');
    }
  };

  // 1-Tap Simulate Deal
  const handleSimulateDeal = async () => {
    const n = generateSimulatedNotification('glitch');
    await processNotification(n);
  };

  const glitchCount = deals.filter(
    (d) => !d.isDismissed && (d.category === 'price_error' || d.product.isPricingGlitch || d.score >= 85)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Clean Minimal Header */}
      <Header
        soundEnabled={settings.alertSound}
        onToggleSound={handleToggleSound}
        onSimulateDeal={handleSimulateDeal}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        totalDealsCount={deals.filter((d) => !d.isDismissed).length}
        glitchCount={glitchCount}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Deals...</span>
          </div>
        ) : (
          <DashboardView
            deals={deals}
            onDismiss={handleDismiss}
            onSimulateDeal={handleSimulateDeal}
          />
        )}
      </main>

      {/* Live Siren Alert Toast Banner */}
      {urgentToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full p-4 rounded-2xl bg-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-950/80 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🚨</span>
              <div>
                <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">
                  DEALS ALERT: PRICE ERROR
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {urgentToast.product.productName}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setUrgentToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 flex items-baseline justify-between text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-emerald-400">
                ${urgentToast.product.dealPrice?.toFixed(2) || 'See site'}
              </span>
              {urgentToast.product.originalPrice && (
                <span className="text-slate-500 line-through">
                  ${urgentToast.product.originalPrice.toFixed(2)}
                </span>
              )}
              {urgentToast.product.discountPercentage && (
                <span className="text-rose-400 font-bold">
                  -{urgentToast.product.discountPercentage}% OFF
                </span>
              )}
            </div>
            <span className="text-slate-400">{urgentToast.product.retailer}</span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              onClick={() => handleDismiss(urgentToast.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Not interested
            </button>
            <button
              onClick={() => {
                const url = urgentToast.product.productUrl || urgentToast.originalPostUrl;
                if (url) window.open(url, '_blank');
                setUrgentToast(null);
              }}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-black text-white flex items-center gap-1 shadow-md"
            >
              <span>Open Deal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Android Phone Sync Modal */}
      <AndroidCompanionModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        settings={settings}
        onTestNotificationSent={refreshData}
      />
    </div>
  );
}
