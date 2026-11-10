import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Smartphone, Copy, Check, Send, ShieldCheck, Terminal, BookOpen, X, RefreshCw } from 'lucide-react';

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
              <h2 className="text-base sm:text-lg font-bold text-white">Android Notification Integration</h2>
              <p className="text-xs text-slate-400">Native Android listener companion setup & webhook connector</p>
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
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'setup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kotlin Service Source
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`py-3 px-3 border-b-2 transition ${
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
              {/* Webhook Endpoint Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Your Ingestion Webhook Endpoint:
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
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
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

              {/* Step by step */}
              <div className="space-y-2.5 pt-2">
                <h4 className="font-bold text-white">How to Activate on Android Device:</h4>
                <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                  <li>Compile and install the companion APK from the project's <code className="text-amber-300">android/</code> directory onto your Android phone.</li>
                  <li>Open Android <strong>Settings &gt; Apps &gt; Special App Access &gt; Notification Access</strong> and toggle <strong>DealHunter Companion</strong> ON.</li>
                  <li>In the companion app, paste your Webhook URL above.</li>
                  <li>You're all set! Notifications from deal accounts on X will now instantly populate DealHunter.</li>
                </ol>
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
