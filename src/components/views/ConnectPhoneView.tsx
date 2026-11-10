import React, { useState } from 'react';
import { AppSettings } from '../../types';
import {
  Smartphone,
  ShieldCheck,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Info,
} from 'lucide-react';

interface ConnectPhoneViewProps {
  settings: AppSettings;
  onSimulateType: (type: 'glitch' | 'clearance' | 'coupon') => void;
  onOpenManualIngest: () => void;
}

export const ConnectPhoneView: React.FC<ConnectPhoneViewProps> = ({
  settings,
  onSimulateType,
  onOpenManualIngest,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${origin}/api/notifications/ingest`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSendTest = async () => {
    setIsSending(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/notifications/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAccount: '@BobaDeals',
          title: '🚨 LIVE TEST: Sony WH-1000XM5 Price Glitch',
          rawText: '🚨 PRICE GLITCH at Amazon: Sony WH-1000XM5 Noise Canceling Headphones down to $69.99 (Reg $399.99)! 82% off! amzn.to/sonyXM5Glitch',
          postUrl: 'https://x.com/BobaDeals/status/test',
          isSimulated: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult('✅ Ingestion received! Check "All Deals" to see it categorized as a Price Error.');
      } else {
        setTestResult(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setTestResult('❌ Failed to reach server endpoint.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Visual Header Explainer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">How Does Notification Reading Work?</h2>
            <p className="text-xs text-slate-400">
              Clear, honest explanation of mobile security & how DealHunter gets your deals
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          For your privacy and security, <strong>Android and iOS browsers strictly prevent websites and PWAs from reading notifications belonging to other apps</strong>. A standard PWA cannot silently intercept your notifications without a companion bridge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Option 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Method 1: Instant Simulation & Testing</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test how DealHunter categorizes deals right now! Tap any button below to see the AI analyze prices, discount percentages, and priority.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onSimulateType('glitch')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition cursor-pointer"
              >
                🚨 Price Error ($39 AirPods)
              </button>
              <button
                onClick={() => onSimulateType('clearance')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
              >
                🔥 Steal Deal (63% Off TV)
              </button>
              <button
                onClick={() => onSimulateType('coupon')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
              >
                🎟️ Coupon Stack (SSD Code)
              </button>
            </div>
          </div>

          {/* Option 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
              <Smartphone className="w-4 h-4" />
              <span>Method 2: Android Companion Forwarder</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use our native Kotlin companion service (included in <code className="text-amber-300">/android</code>). It uses Android's <code className="text-amber-300">NotificationListenerService</code> to filter notifications from the official X app only and send them to your DealHunter webhook.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenManualIngest}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Or Paste Tweet Manually
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Endpoint Tester */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white">Your DealHunter Ingest Webhook</h3>
        <p className="text-xs text-slate-400">
          This is the private endpoint your phone or any script sends notifications to.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-emerald-300 font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
          </button>
        </div>

        <div className="pt-1 flex items-center gap-3">
          <button
            onClick={handleSendTest}
            disabled={isSending}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending Test...' : 'Test Send Webhook Deal'}</span>
          </button>

          {testResult && (
            <span className="text-xs font-medium text-emerald-300">{testResult}</span>
          )}
        </div>
      </div>
    </div>
  );
};
