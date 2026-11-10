import React, { useState, useEffect, useCallback } from 'react';
import {
  Deal,
  CapturedNotification,
  XAccount,
  CustomRule,
  PurchaseRecord,
  AppSettings,
} from './types';
import { dbService, DEFAULT_SETTINGS } from './services/db';
import { extractDealLocally, extractDealWithAI } from './services/intelligence';
import { evaluateCustomRules } from './services/rulesEngine';
import { notifier } from './services/notifier';
import {
  generateSimulatedNotification,
  generateDuplicateNotification,
} from './services/simulatedFeed';
import { Header, SimpleNavTab } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { DealsView } from './components/views/DealsView';
import { NotificationsView } from './components/views/NotificationsView';
import { ConnectPhoneView } from './components/views/ConnectPhoneView';
import { DealDetailModal } from './components/DealDetailModal';
import { AndroidCompanionModal } from './components/AndroidCompanionModal';
import { ManualIngestModal } from './components/ManualIngestModal';
import { Zap, X, ExternalLink, Bookmark, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<SimpleNavTab>('deals');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [notifications, setNotifications] = useState<CapturedNotification[]>([]);
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isManualIngestOpen, setIsManualIngestOpen] = useState(false);

  // Urgent live toast alert
  const [urgentToast, setUrgentToast] = useState<Deal | null>(null);

  // Load all initial data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [dList, nList, aList, rList, pList, sData] = await Promise.all([
        dbService.getDeals(),
        dbService.getNotifications(),
        dbService.getAccounts(),
        dbService.getRules(),
        dbService.getPurchases(),
        dbService.getSettings(),
      ]);

      setDeals(dList);
      setNotifications(nList);
      setAccounts(aList);
      setRules(rList);
      setPurchases(pList);
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

  // Process a newly arrived notification through the DealHunter ingestion pipeline
  const processNotification = useCallback(
    async (rawNotif: CapturedNotification) => {
      // 1. Check duplicate
      const isDuplicate = await dbService.checkDuplicateNotification(
        rawNotif.rawText,
        rawNotif.sourceAccount
      );

      if (isDuplicate) {
        const dupNotif: CapturedNotification = {
          ...rawNotif,
          status: 'duplicate',
        };
        await dbService.saveNotification(dupNotif);
        setNotifications((prev) => [dupNotif, ...prev.filter((n) => n.id !== dupNotif.id)]);
        return null;
      }

      // Save initial queued notification
      await dbService.saveNotification(rawNotif);

      // 2. Deal Extraction & Intelligence Engine
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
        aiConfidence: parseResult.aiConfidence,
        aiModelUsed: parseResult.aiModelUsed,
        aiCostEstimate: parseResult.aiCostEstimate,
        verificationStatus: 'not_verified',
        isSaved: false,
        isDismissed: false,
        isViewed: false,
        createdAt: Date.now(),
        purchasePrepared: false,
      };

      // 4. Custom Rules Engine Evaluation
      const ruleEvaluation = evaluateCustomRules(newDeal, rules, accounts);
      if (ruleEvaluation.matchedRule) {
        newDeal.matchedRuleId = ruleEvaluation.matchedRule.id;
        newDeal.matchedRuleName = ruleEvaluation.matchedRule.name;

        if (ruleEvaluation.actionTaken === 'ignore') {
          newDeal.isDismissed = true;
          newDeal.score = 0;
          newDeal.priority = 'low';
        } else if (ruleEvaluation.actionTaken === 'elevated_critical') {
          newDeal.score = Math.max(95, newDeal.score);
          newDeal.priority = 'critical';
          newDeal.scoreReasons.push(ruleEvaluation.reason!);
        } else if (ruleEvaluation.actionTaken === 'purchase_prepared') {
          newDeal.purchasePrepared = true;
          newDeal.scoreReasons.push(ruleEvaluation.reason!);
        }
      }

      // Save updated notification status
      const updatedNotif: CapturedNotification = {
        ...rawNotif,
        status: newDeal.isDismissed ? 'ignored' : 'processed',
        dealId: newDeal.id,
      };
      await dbService.saveNotification(updatedNotif);
      await dbService.saveDeal(newDeal);

      // 5. Update local React states
      setDeals((prev) => [newDeal, ...prev.filter((d) => d.id !== newDeal.id)]);
      setNotifications((prev) => [updatedNotif, ...prev.filter((n) => n.id !== updatedNotif.id)]);

      // 6. Urgent Alert Notification Trigger
      if (!newDeal.isDismissed) {
        notifier.sendUrgentAlert(
          newDeal,
          settings.alertSound,
          settings.alertVibrate,
          settings.minNotificationPriority
        );

        // Show in-app live alert toast for critical / excellent deals
        if (newDeal.priority === 'critical' || newDeal.priority === 'excellent') {
          setUrgentToast(newDeal);
        }
      }

      return newDeal;
    },
    [accounts, rules, settings]
  );

  // Background polling for notifications forwarded by Android companion to the server queue
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
        // Dev server / network quiet catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [settings.autoMonitoring, processNotification]);

  // Deal card handlers
  const handleToggleSave = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const updated = { ...deal, isSaved: !deal.isSaved };
    await dbService.saveDeal(updated);
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    if (selectedDeal?.id === dealId) setSelectedDeal(updated);
  };

  const handleDismiss = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const updated = { ...deal, isDismissed: true };
    await dbService.saveDeal(updated);
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    if (selectedDeal?.id === dealId) setSelectedDeal(null);
    if (urgentToast?.id === dealId) setUrgentToast(null);
  };

  const handleUpdateDeal = async (updatedDeal: Deal) => {
    await dbService.saveDeal(updatedDeal);
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);
  };

  const handleMarkPurchased = async (deal: Deal) => {
    const purchaseRecord: PurchaseRecord = {
      id: `purch-${Date.now()}`,
      dealId: deal.id,
      productName: deal.product.productName,
      retailer: deal.product.retailer,
      price: deal.product.dealPrice || 0,
      originalPrice: deal.product.originalPrice,
      discountPercentage: deal.product.discountPercentage,
      productUrl: deal.product.productUrl || '#',
      preparedAt: Date.now(),
      status: 'user_confirmed',
      confirmedAt: Date.now(),
    };
    await dbService.savePurchase(purchaseRecord);
    setPurchases((prev) => [purchaseRecord, ...prev]);

    alert(`Marked "${deal.product.productName}" as purchased!`);
  };

  const handleReportIncorrect = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const updated = { ...deal, userReportedIncorrect: true };
    await dbService.saveDeal(updated);
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    setSelectedDeal(updated);
    alert('Feedback recorded for model tuning.');
  };

  // Toggle monitoring
  const handleToggleMonitoring = async () => {
    const nextState = !settings.autoMonitoring;
    const updated: AppSettings = {
      ...settings,
      autoMonitoring: nextState,
      monitoringState: nextState ? 'active' : 'paused',
    };
    await dbService.saveSettings(updated);
    setSettings(updated);
  };

  // Simulate deal burst
  const handleSimulateBurst = async () => {
    const n = generateSimulatedNotification('glitch');
    await processNotification(n);
  };

  const handleSimulateType = async (type: 'glitch' | 'clearance' | 'coupon') => {
    const n = generateSimulatedNotification(type);
    await processNotification(n);
    setCurrentTab('deals');
  };

  // Manual ingest
  const handleManualIngest = async (
    title: string,
    rawText: string,
    sourceAccount: string,
    postUrl: string | null
  ) => {
    const notif: CapturedNotification = {
      id: `manual-${Date.now()}`,
      sourceAccount,
      title,
      rawText,
      postUrl,
      receivedAt: Date.now(),
      status: 'queued',
      isSimulated: false,
      dealId: null,
    };
    await processNotification(notif);
  };

  // Counts for header badges
  const criticalCount = deals.filter(
    (d) => !d.isDismissed && (d.priority === 'critical' || d.category === 'price_error')
  ).length;
  const savedCount = deals.filter((d) => !d.isDismissed && d.isSaved).length;
  const duplicateCount = notifications.filter((n) => n.status === 'duplicate').length;
  const expiredCount = deals.filter(
    (d) => !d.isDismissed && d.verificationStatus === 'expired_oos'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        settings={settings}
        onToggleMonitoring={handleToggleMonitoring}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenManualIngest={() => setIsManualIngestOpen(true)}
        onSimulateBurst={handleSimulateBurst}
        criticalCount={criticalCount}
        savedCount={savedCount}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading DealHunter...</span>
          </div>
        ) : (
          <>
            {currentTab === 'deals' && (
              <DashboardView
                deals={deals}
                notificationsCountToday={notifications.length}
                duplicateCount={duplicateCount}
                expiredCount={expiredCount}
                queueCount={0}
                settings={settings}
                onOpenDetail={(d) => setSelectedDeal(d)}
                onToggleSave={handleToggleSave}
                onDismiss={handleDismiss}
                onPreparePurchase={(d) => setSelectedDeal(d)}
                onSimulateBurst={handleSimulateBurst}
                onOpenManualIngest={() => setIsManualIngestOpen(true)}
                onOpenConnect={() => setCurrentTab('connect')}
              />
            )}

            {currentTab === 'saved' && (
              <DealsView
                mode="saved"
                deals={deals}
                onOpenDetail={(d) => setSelectedDeal(d)}
                onToggleSave={handleToggleSave}
                onDismiss={handleDismiss}
                onPreparePurchase={(d) => setSelectedDeal(d)}
              />
            )}

            {currentTab === 'feed_log' && (
              <NotificationsView
                notifications={notifications}
                onReprocess={async (n) => {
                  await processNotification(n);
                }}
                onClearAllNotifications={async () => {
                  setNotifications([]);
                }}
              />
            )}

            {currentTab === 'connect' && (
              <ConnectPhoneView
                settings={settings}
                onSimulateType={handleSimulateType}
                onOpenManualIngest={() => setIsManualIngestOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Urgent Toast Alert Banner */}
      {urgentToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full p-4 rounded-2xl bg-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-950/80 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    {urgentToast.category === 'price_error' ? '🚨 Price Glitch Alert' : '⚡ Urgent Deal Alert'}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {urgentToast.score}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                  {urgentToast.product.productName}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setUrgentToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-emerald-400">
                ${urgentToast.product.dealPrice?.toFixed(2) || 'See site'}
              </span>
              {urgentToast.product.originalPrice && (
                <span className="text-slate-500 line-through">
                  ${urgentToast.product.originalPrice.toFixed(2)}
                </span>
              )}
              {urgentToast.product.discountPercentage && (
                <span className="text-rose-400 font-bold">
                  -{urgentToast.product.discountPercentage}%
                </span>
              )}
            </div>
            <span className="text-slate-400">{urgentToast.product.retailer}</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedDeal(urgentToast);
                setUrgentToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              Inspect
            </button>
            {urgentToast.product.productUrl && (
              <a
                href={urgentToast.product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setUrgentToast(null)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>Open Deal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <DealDetailModal
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onToggleSave={handleToggleSave}
        onDismiss={handleDismiss}
        onMarkPurchased={handleMarkPurchased}
        onReportIncorrect={handleReportIncorrect}
        onUpdateDeal={handleUpdateDeal}
      />

      <AndroidCompanionModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        settings={settings}
        onTestNotificationSent={refreshData}
      />

      <ManualIngestModal
        isOpen={isManualIngestOpen}
        onClose={() => setIsManualIngestOpen(false)}
        accounts={accounts}
        onIngest={handleManualIngest}
      />
    </div>
  );
}
