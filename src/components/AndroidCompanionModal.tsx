import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { notifier } from '../services/notifier';
import { Smartphone, Copy, Check, Send, ShieldCheck, X, RefreshCw, BellRing, AlertTriangle } from 'lucide-react';

interface AndroidCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onTestNotificationSent: () => void;
}

export const AndroidCompanionModal: React.FC<AndroidCompanionModalProps> = ({
  isOpen,
  onClose,
  settings,
  onTestNotificationSent,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'code' | 'curl'>('setup');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (isOpen) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotifPerm('unsupported');
      } else {
        setNotifPerm(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${origin}/api/notifications/ingest`;

  const sampleCurl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-DealHunter-Secret: ${settings.webhookSecret}" \\
  -d '{
    "sourceAccount": "@BobaDeals",
    "title": "🚨 PRICE GLITCH at Amazon!",
    "rawText": "Apple AirPods Pro (2nd Gen) USB-C only $39.99 (was $249.99) at Amazon! amzn.to/airpods-glitch",
    "postUrl": "https://x.com/BobaDeals/status/1789401928374",
    "isSimulated": false
  }'`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleEnableBrowserAlerts = async () => {
    const perm = await notifier.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      notifier.playAlertSound('excellent');
    }
  };

  const handleSendTestWebhook = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/notifications/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DealHunter-Secret': settings.webhookSecret,
        },
        body: JSON.stringify({
          sourceAccount: '@BobaDeals',
          title: '🚨 Test Ingestion: Apple Watch Ultra 2 Price Glitch',
          rawText: '🚨 REALTIME TEST GLITCH: Apple Watch Ultra 2 (Titanium) dropped to $119.99 (orig $799.00) at Best Buy! Ingestion verified! bestbuy.com/ultra2',
          postUrl: 'https://x.com/BobaDeals/status/test123',
          isSimulated: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`✅ Webhook ping successful! Enqueued notification ID: ${data.notificationId}`);
        onTestNotificationSent();
      } else {
        setTestResult(`❌ Server returned error: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Mobile Setup & Permissions</h2>
              <p className="text-xs text-slate-400">What to enable on your phone for alerts & automatic X syncing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs font-semibold px-5">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'setup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mobile Checklist
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kotlin Service Source
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'curl'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            cURL / Webhook API
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
          {activeTab === 'setup' && (
            <div className="space-y-4">
              {/* Step 1: Mobile PWA Notification Permission Check */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-xs sm:text-sm">1. PWA Deal Alerts Permission</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    {notifPerm === 'granted'
                      ? '✅ Enabled! This installed PWA can pop up deal alerts on your phone.'
                      : notifPerm === 'denied'
                      ? '❌ Blocked in browser/phone settings. Enable Notifications for this site in your mobile browser settings.'
                      : notifPerm === 'unsupported'
                      ? 'ℹ️ On iPhone/iPad, install to Home Screen first via Safari Share > Add to Home Screen, then enable notifications.'
                      : '⚠️ Not enabled yet. Tap the button to allow urgent deal alerts on your phone.'}
                  </p>
                </div>
                {notifPerm === 'default' && (
                  <button
                    onClick={handleEnableBrowserAlerts}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shrink-0 cursor-pointer"
                  >
                    Allow Alerts
                  </button>
                )}
              </div>

              {/* Step 2: Why PWAs can't read notifications directly + Easy 2-Min Solution */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>2. Reading X Notifications Automatically (No Coding Needed!)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why a web app/PWA can&apos;t read your notification panel directly:</strong> Android &amp; iOS block all browsers/PWAs from reading notifications belonging to other apps (like X, WhatsApp, or banking apps) for security.
                </p>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-emerald-400">
                    ✅ Easiest Way (2 Mins, No APK Building — Free Play Store App):
                  </p>
                  <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                    <li>Install <strong>MacroDroid</strong> (free on Google Play Store) on your Android phone and grant it <strong>Notification Access</strong> when asked.</li>
                    <li>Tap <strong>Add Macro</strong> → <strong>Trigger:</strong> <code className="text-amber-300">Device Events &gt; Notification &gt; Notification Received</code> → Select <strong>X (Twitter)</strong> only.</li>
                    <li><strong>Action:</strong> <code className="text-amber-300">Web Interactions &gt; HTTP Request</code> → Method: <strong>POST</strong> → Paste your Webhook URL below.</li>
                    <li>Under <strong>Content Body / Parameters</strong> (Form URL-Encoded), add:<br />
                      <code className="text-emerald-300">title</code> = <code className="text-slate-200">{`{not_title}`}</code> &nbsp;|&nbsp; <code className="text-emerald-300">rawText</code> = <code className="text-slate-200">{`{notification}`}</code>
                    </li>
                  </ol>
                </div>
                <p className="text-[11px] text-slate-400">
                  *(Advanced users can also build the custom Kotlin <code className="text-amber-300">NotificationListenerService</code> in the second tab instead of MacroDroid.)*
                </p>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Your Ingestion Webhook Endpoint (Paste into MacroDroid or Companion):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Test Ping Action */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white">Verify Webhook Ingestion</h4>
                  <p className="text-xs text-slate-400">
                    Send a test payload to verify the server ingest pipeline.
                  </p>
                </div>
                <button
                  onClick={handleSendTestWebhook}
                  disabled={isSendingTest}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isSendingTest ? 'Sending...' : 'Test Ingest Now'}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  {testResult}
                </div>
              )}

              {/* Privacy boundary highlights */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Privacy & System Boundary Guarantees
                </h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside text-xs">
                  <li>
                    <strong>X-Only Filtering</strong>: The companion service filters strictly by <code className="text-amber-300">com.twitter.android</code>. Notifications from messages, banking, or personal apps are discarded instantly on-device.
                  </li>
                  <li>
                    <strong>Zero Cloud Relay</strong>: Payloads travel directly from your Android device to your DealHunter instance without third-party proxies.
                  </li>
                  <li>
                    <strong>De-duplication</strong>: Built-in LRU cache drops repetitive deal alerts before ingestion.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  File: <code className="text-amber-400">android/DealHunterNotificationService.kt</code>
                </span>
                <span className="text-[11px] text-slate-400">Extends NotificationListenerService</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
{`// android/DealHunterNotificationService.kt
package com.dealhunter.companion

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class DealHunterNotificationService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val pkg = sbn?.packageName ?: return
        // 🔒 Only X / Twitter notifications are inspected
        if (pkg != "com.twitter.android" && pkg != "com.twitter.android.lite") {
            return
        }
        val title = sbn.notification.extras.getString("android.title") ?: ""
        val text = sbn.notification.extras.getString("android.text") ?: ""
        // Forward HTTP POST to DealHunter webhook...
    }
}`}
              </pre>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Test via Command Line / Terminal:</span>
                <button
                  onClick={handleCopyCurl}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto select-all">
                {sampleCurl}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
