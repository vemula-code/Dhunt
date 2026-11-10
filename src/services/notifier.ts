import { Deal, PriorityLevel } from '../types';

class UrgentNotifier {
  private audioCtx: AudioContext | null = null;
  private listeners: ((deal: Deal) => void)[] = [];

  constructor() {
    // AudioContext will be initialized on user interaction if needed
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Synthesize crisp urgent alert chime without requiring external audio files
  playAlertSound(priority: PriorityLevel) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (priority === 'critical') {
        // High urgency 2-tone alarm: 880Hz (A5) -> 1320Hz (E6)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Second tone burst
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
        gain2.gain.setValueAtTime(0.35, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.55);
      } else if (priority === 'excellent') {
        // Pleasant rising chime: 587Hz -> 880Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // A5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Subtle single chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  vibrate(priority: PriorityLevel) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (priority === 'critical') {
        navigator.vibrate([150, 80, 150, 80, 300]);
      } else if (priority === 'excellent') {
        navigator.vibrate([200, 100, 200]);
      } else {
        navigator.vibrate([150]);
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  sendUrgentAlert(
    deal: Deal,
    soundEnabled = true,
    vibrateEnabled = true,
    minPriority: PriorityLevel = 'good'
  ) {
    const priorityRanks: Record<PriorityLevel, number> = {
      critical: 4,
      excellent: 3,
      good: 2,
      normal: 1,
      low: 0,
    };

    // Filter by threshold
    if (priorityRanks[deal.priority] < priorityRanks[minPriority]) {
      return;
    }

    if (soundEnabled) {
      this.playAlertSound(deal.priority);
    }

    if (vibrateEnabled) {
      this.vibrate(deal.priority);
    }

    // Trigger in-app subscriber callbacks
    this.listeners.forEach((fn) => fn(deal));

    // Send native Web Notification if permission granted
    if (this.hasPermission()) {
      try {
        const title = deal.category === 'price_error'
          ? `🚨 PRICE GLITCH (${deal.score}/100): ${deal.product.productName}`
          : `⚡ [${deal.priority.toUpperCase()}] ${deal.product.productName}`;

        const priceText = deal.product.dealPrice !== null
          ? `$${deal.product.dealPrice.toFixed(2)}${deal.product.originalPrice ? ` (was $${deal.product.originalPrice.toFixed(2)})` : ''}`
          : 'Deal detected';

        const body = `${priceText} at ${deal.product.retailer} via ${deal.sourceAccount}\n${deal.scoreReasons[0] || ''}`;

        const notif = new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `deal-${deal.id}`,
          requireInteraction: deal.priority === 'critical',
        });

        notif.onclick = () => {
          window.focus();
          if (deal.product.productUrl) {
            window.open(deal.product.productUrl, '_blank');
          }
        };
      } catch (err) {
        console.warn('Native Web Notification failed:', err);
      }
    }
  }

  subscribe(callback: (deal: Deal) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const notifier = new UrgentNotifier();
