import { Deal, CapturedNotification, CustomRule, XAccount, PurchaseRecord, AppSettings } from '../types';

const DB_NAME = 'dealhunter_local_db';
const DB_VERSION = 1;

export const DEFAULT_SCORING_WEIGHTS = {
  pricingGlitch: 35,
  discount80: 30,
  discount60: 20,
  discount40: 10,
  limitedTime: 15,
  coupon: 5,
  trustedAccount: 10,
  duplicatePenalty: -50,
  expiredPenalty: -100,
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoMonitoring: true,
  monitoringState: 'active',
  useGeminiAI: true,
  alertSound: true,
  alertVibrate: true,
  minNotificationPriority: 'good',
  webhookSecret: 'dh_sec_' + Math.random().toString(36).substring(2, 10),
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  autoPurchase: {
    enabled: false,
    dailySpendLimit: 50,
    currentDailySpent: 0,
    maxPricePerItem: 25,
    minDiscount: 65,
    allowedRetailers: ['Amazon', 'Walmart', 'Best Buy'],
    allowedCategories: ['Electronics', 'Gaming'],
    requireConfirmation: true,
  },
  theme: 'dark',
};

export const DEFAULT_ACCOUNTS: XAccount[] = [
  {
    username: '@Wario64',
    displayName: 'Wario64 Deals',
    isTrusted: true,
    isMuted: false,
    priorityModifier: 10,
    totalDeals: 18,
    criticalDeals: 4,
    notes: 'Major gaming, console, and electronics flash deals. Known for price error alerts.',
  },
  {
    username: '@FatKidDeals',
    displayName: 'Fat Kid Deals',
    isTrusted: true,
    isMuted: false,
    priorityModifier: 8,
    totalDeals: 24,
    criticalDeals: 2,
    notes: 'Amazon lightning deals, kitchen appliances, and tech discounts.',
  },
  {
    username: '@videogamedeals',
    displayName: 'Video Game Deals',
    isTrusted: true,
    isMuted: false,
    priorityModifier: 5,
    totalDeals: 14,
    criticalDeals: 1,
    notes: 'PlayStation, Xbox, Nintendo Switch, and PC digital code price drops.',
  },
  {
    username: '@BobaDeals',
    displayName: 'Boba Deals & Glitches',
    isTrusted: true,
    isMuted: false,
    priorityModifier: 12,
    totalDeals: 9,
    criticalDeals: 5,
    notes: 'Specializes in retailer pricing glitches and clearance coupon stacking.',
  },
  {
    username: '@DailyDealsCentral',
    displayName: 'Daily Deals Central',
    isTrusted: false,
    isMuted: false,
    priorityModifier: 0,
    totalDeals: 32,
    criticalDeals: 1,
    notes: 'General deals aggregator, medium signal-to-noise ratio.',
  },
];

export const DEFAULT_RULES: CustomRule[] = [
  {
    id: 'rule-glitches',
    name: 'Pricing Glitches Instant Alert',
    enabled: true,
    retailers: [],
    categories: [],
    dealTypes: ['price_error'],
    minDiscount: null,
    maxPrice: null,
    trustedAccountsOnly: false,
    excludedKeywords: ['refurbished', 'used'],
    includedKeywords: ['glitch', 'price error', 'mistake', 'run'],
    action: 'notify_critical',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'rule-electronics-half-off',
    name: 'Amazon & Best Buy Tech 50%+ Off',
    enabled: true,
    retailers: ['Amazon', 'Best Buy'],
    categories: ['Electronics', 'Gaming', 'Computers'],
    dealTypes: ['extreme_discount', 'regular_discount', 'lightning_deal'],
    minDiscount: 50,
    maxPrice: 200,
    trustedAccountsOnly: false,
    excludedKeywords: ['case', 'screen protector', 'cable'],
    includedKeywords: [],
    action: 'notify_normal',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'rule-under-20',
    name: 'Steal Deals Under $20',
    enabled: true,
    retailers: [],
    categories: [],
    dealTypes: ['extreme_discount', 'price_error', 'coupon_promo'],
    minDiscount: 60,
    maxPrice: 20,
    trustedAccountsOnly: false,
    excludedKeywords: [],
    includedKeywords: [],
    action: 'auto_prepare_purchase',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'rule-ignore-apparel',
    name: 'Ignore Fast Fashion Apparel',
    enabled: true,
    retailers: [],
    categories: ['Apparel'],
    dealTypes: [],
    minDiscount: null,
    maxPrice: null,
    trustedAccountsOnly: false,
    excludedKeywords: [],
    includedKeywords: ['socks', 't-shirt', 'hoodie'],
    action: 'ignore',
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_DEMO_NOTIFICATIONS: CapturedNotification[] = [
  {
    id: 'notif-demo-1',
    sourceAccount: '@BobaDeals',
    title: '🚨 PRICE GLITCH at Amazon!',
    rawText: '🚨 PRICE GLITCH at Amazon: Apple AirPods Pro (2nd Gen) with USB-C MagSafe Case down to $39.99 (was $249.99)! 84% OFF! Run, price error will be canceled or fixed quickly! amzn.to/3GlitchAirPods',
    postUrl: 'https://x.com/BobaDeals/status/1789401928374',
    receivedAt: Date.now() - 1000 * 60 * 12,
    status: 'processed',
    isSimulated: true,
    dealId: 'deal-demo-1',
  },
  {
    id: 'notif-demo-2',
    sourceAccount: '@Wario64',
    title: 'PlayStation 5 DualSense Controller Deal',
    rawText: 'Best Buy has PlayStation 5 DualSense Wireless Controller (Midnight Black) on sale for $44.99 (Reg. $74.99). Free store pickup available. bestbuy.com/site/ps5-dualsense/6464303.p',
    postUrl: 'https://x.com/Wario64/status/1789381928491',
    receivedAt: Date.now() - 1000 * 60 * 34,
    status: 'processed',
    isSimulated: true,
    dealId: 'deal-demo-2',
  },
  {
    id: 'notif-demo-3',
    sourceAccount: '@FatKidDeals',
    title: 'Walmart Clearance: Sony 65" 4K Smart TV',
    rawText: 'Walmart In-Store & Online Clearance: Sony 65-Inch Bravia 4K Ultra HD Google TV only $298.00 (was $798.00). Extreme discount while inventory lasts! walmart.com/ip/sony-65-bravia-4k/9831924',
    postUrl: 'https://x.com/FatKidDeals/status/1789351029411',
    receivedAt: Date.now() - 1000 * 60 * 68,
    status: 'processed',
    isSimulated: true,
    dealId: 'deal-demo-3',
  },
  {
    id: 'notif-demo-4',
    sourceAccount: '@videogamedeals',
    title: 'Samsung 990 PRO 2TB NVMe SSD Coupon',
    rawText: 'Amazon has Samsung 990 PRO Series 2TB PCIe 4.0 NVMe Gen4 Internal Gaming SSD for $119.99 when you clip the $40 coupon on page (regular $189.99). amzn.to/samsung990pro',
    postUrl: 'https://x.com/videogamedeals/status/1789291029112',
    receivedAt: Date.now() - 1000 * 60 * 115,
    status: 'processed',
    isSimulated: true,
    dealId: 'deal-demo-4',
  },
  {
    id: 'notif-demo-5',
    sourceAccount: '@BobaDeals',
    title: 'Target Lightning Deal: KitchenAid Mixer',
    rawText: 'Target Limited Time Lightning Deal: KitchenAid Artisan 5-Quart Stand Mixer down to $219.99 (Retail $449.99). Ends in 3 hours or when sold out. target.com/p/kitchenaid-artisan-5qt',
    postUrl: 'https://x.com/BobaDeals/status/1789251029990',
    receivedAt: Date.now() - 1000 * 60 * 180,
    status: 'processed',
    isSimulated: true,
    dealId: 'deal-demo-5',
  },
];

export const INITIAL_DEMO_DEALS: Deal[] = [
  {
    id: 'deal-demo-1',
    notificationId: 'notif-demo-1',
    sourceAccount: '@BobaDeals',
    rawNotificationText: '🚨 PRICE GLITCH at Amazon: Apple AirPods Pro (2nd Gen) with USB-C MagSafe Case down to $39.99 (was $249.99)! 84% OFF! Run, price error will be canceled or fixed quickly! amzn.to/3GlitchAirPods',
    originalPostUrl: 'https://x.com/BobaDeals/status/1789401928374',
    product: {
      productName: 'Apple AirPods Pro (2nd Gen) with USB-C MagSafe Case',
      brand: 'Apple',
      retailer: 'Amazon',
      originalPrice: 249.99,
      dealPrice: 39.99,
      discountPercentage: 84,
      couponCode: null,
      productUrl: 'https://www.amazon.com/dp/B0CHWRXH8B',
      isPricingGlitch: true,
      productCategory: 'Electronics',
      expirationInfo: 'Urgent: Glitch active now',
      stockStatus: 'in_stock',
      shippingInfo: 'Free Prime Shipping',
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&q=80',
    },
    category: 'price_error',
    score: 98,
    priority: 'critical',
    scoreReasons: [
      'Potential pricing glitch detected (+35)',
      'Extreme discount above 80% (+30)',
      'Known trusted glitch account @BobaDeals (+10)',
      'Brand flagship product recognized (+15)',
      'Matched rule: Pricing Glitches Instant Alert (+8)',
    ],
    aiClassified: true,
    aiConfidence: 0.96,
    aiModelUsed: 'gemini-3.8-flash',
    aiCostEstimate: 0.000042,
    verificationStatus: 'verified_active',
    verificationDetails: 'Confirmed price anomaly ($39.99 vs MSRP $249.99). Retailer page active.',
    isSaved: true,
    isDismissed: false,
    isViewed: false,
    createdAt: Date.now() - 1000 * 60 * 12,
    purchasePrepared: true,
    matchedRuleId: 'rule-glitches',
    matchedRuleName: 'Pricing Glitches Instant Alert',
  },
  {
    id: 'deal-demo-2',
    notificationId: 'notif-demo-2',
    sourceAccount: '@Wario64',
    rawNotificationText: 'Best Buy has PlayStation 5 DualSense Wireless Controller (Midnight Black) on sale for $44.99 (Reg. $74.99). Free store pickup available. bestbuy.com/site/ps5-dualsense/6464303.p',
    originalPostUrl: 'https://x.com/Wario64/status/1789381928491',
    product: {
      productName: 'PlayStation 5 DualSense Wireless Controller (Midnight Black)',
      brand: 'Sony PlayStation',
      retailer: 'Best Buy',
      originalPrice: 74.99,
      dealPrice: 44.99,
      discountPercentage: 40,
      couponCode: null,
      productUrl: 'https://www.bestbuy.com/site/sony-playstation-5-dualsense-wireless-controller-midnight-black/6464303.p',
      isPricingGlitch: false,
      productCategory: 'Gaming',
      expirationInfo: 'Weekly promo',
      stockStatus: 'in_stock',
      shippingInfo: 'Free store pickup / free shipping over $35',
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80',
    },
    category: 'regular_discount',
    score: 65,
    priority: 'good',
    scoreReasons: [
      'Discount 40% (+10)',
      'Trusted account @Wario64 (+10)',
      'Verified retailer Best Buy (+15)',
      'Official hardware accessory (+15)',
      'Matched rule: Amazon & Best Buy Tech 50%+ Off (+15)',
    ],
    aiClassified: true,
    aiConfidence: 0.94,
    aiModelUsed: 'gemini-3.8-flash',
    aiCostEstimate: 0.000038,
    verificationStatus: 'verified_active',
    verificationDetails: 'Product in stock at $44.99 on Best Buy.',
    isSaved: false,
    isDismissed: false,
    isViewed: true,
    createdAt: Date.now() - 1000 * 60 * 34,
    matchedRuleId: 'rule-electronics-half-off',
    matchedRuleName: 'Amazon & Best Buy Tech 50%+ Off',
  },
  {
    id: 'deal-demo-3',
    notificationId: 'notif-demo-3',
    sourceAccount: '@FatKidDeals',
    rawNotificationText: 'Walmart In-Store & Online Clearance: Sony 65-Inch Bravia 4K Ultra HD Google TV only $298.00 (was $798.00). Extreme discount while inventory lasts! walmart.com/ip/sony-65-bravia-4k/9831924',
    originalPostUrl: 'https://x.com/FatKidDeals/status/1789351029411',
    product: {
      productName: 'Sony 65" Bravia 4K Ultra HD Smart Google TV',
      brand: 'Sony',
      retailer: 'Walmart',
      originalPrice: 798.00,
      dealPrice: 298.00,
      discountPercentage: 63,
      couponCode: null,
      productUrl: 'https://www.walmart.com/ip/sony-65-bravia-4k/9831924',
      isPricingGlitch: false,
      productCategory: 'Electronics',
      expirationInfo: 'Clearance inventory clearance',
      stockStatus: 'low_stock',
      shippingInfo: 'Free delivery or in-store pickup',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80',
    },
    category: 'clearance',
    score: 82,
    priority: 'excellent',
    scoreReasons: [
      'Discount above 60% (+20)',
      'Clearance high dollar savings ($500 off) (+25)',
      'Trusted deal source @FatKidDeals (+10)',
      'Major home entertainment category (+15)',
      'Limited stock clearance factor (+12)',
    ],
    aiClassified: true,
    aiConfidence: 0.95,
    aiModelUsed: 'gemini-3.8-flash',
    aiCostEstimate: 0.000041,
    verificationStatus: 'verified_active',
    verificationDetails: 'Rollback clearance price confirmed.',
    isSaved: true,
    isDismissed: false,
    isViewed: true,
    createdAt: Date.now() - 1000 * 60 * 68,
    matchedRuleId: 'rule-electronics-half-off',
    matchedRuleName: 'Amazon & Best Buy Tech 50%+ Off',
  },
  {
    id: 'deal-demo-4',
    notificationId: 'notif-demo-4',
    sourceAccount: '@videogamedeals',
    rawNotificationText: 'Amazon has Samsung 990 PRO Series 2TB PCIe 4.0 NVMe Gen4 Internal Gaming SSD for $119.99 when you clip the $40 coupon on page (regular $189.99). amzn.to/samsung990pro',
    originalPostUrl: 'https://x.com/videogamedeals/status/1789291029112',
    product: {
      productName: 'Samsung 990 PRO Series 2TB PCIe 4.0 NVMe Internal SSD',
      brand: 'Samsung',
      retailer: 'Amazon',
      originalPrice: 189.99,
      dealPrice: 119.99,
      discountPercentage: 37,
      couponCode: 'Clip $40 on-page coupon',
      productUrl: 'https://www.amazon.com/dp/B0BHJJ9358',
      isPricingGlitch: false,
      productCategory: 'Computers',
      expirationInfo: 'Coupon available while quantities last',
      stockStatus: 'in_stock',
      shippingInfo: 'Free Prime One-Day Shipping',
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=400&q=80',
    },
    category: 'coupon_promo',
    score: 62,
    priority: 'good',
    scoreReasons: [
      'Coupon clip available (+5)',
      'Discount 37% (+10)',
      'Trusted account @videogamedeals (+10)',
      'All-time low benchmark on 2TB NVMe (+20)',
      'Popular storage upgrade (+17)',
    ],
    aiClassified: true,
    aiConfidence: 0.92,
    aiModelUsed: 'gemini-3.8-flash',
    aiCostEstimate: 0.000039,
    verificationStatus: 'verified_active',
    verificationDetails: 'On-page coupon active on Amazon.',
    isSaved: false,
    isDismissed: false,
    isViewed: false,
    createdAt: Date.now() - 1000 * 60 * 115,
  },
  {
    id: 'deal-demo-5',
    notificationId: 'notif-demo-5',
    sourceAccount: '@BobaDeals',
    rawNotificationText: 'Target Limited Time Lightning Deal: KitchenAid Artisan 5-Quart Stand Mixer down to $219.99 (Retail $449.99). Ends in 3 hours or when sold out. target.com/p/kitchenaid-artisan-5qt',
    originalPostUrl: 'https://x.com/BobaDeals/status/1789251029990',
    product: {
      productName: 'KitchenAid Artisan Series 5-Quart Tilt-Head Stand Mixer',
      brand: 'KitchenAid',
      retailer: 'Target',
      originalPrice: 449.99,
      dealPrice: 219.99,
      discountPercentage: 51,
      couponCode: null,
      productUrl: 'https://www.target.com/p/kitchenaid-artisan-5qt',
      isPricingGlitch: false,
      productCategory: 'Home & Kitchen',
      expirationInfo: 'Lightning deal: ends in 3 hours',
      stockStatus: 'low_stock',
      shippingInfo: 'Free shipping or store pickup',
      imageUrl: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80',
    },
    category: 'lightning_deal',
    score: 78,
    priority: 'excellent',
    scoreReasons: [
      'Discount above 50% (+20)',
      'Limited-time lightning deal (+15)',
      'Premium brand KitchenAid (+15)',
      'High savings ($230 off) (+18)',
      'Trusted deal account @BobaDeals (+10)',
    ],
    aiClassified: true,
    aiConfidence: 0.93,
    aiModelUsed: 'gemini-3.8-flash',
    aiCostEstimate: 0.00004,
    verificationStatus: 'verified_active',
    verificationDetails: 'Target Lightning Deal verified active.',
    isSaved: false,
    isDismissed: false,
    isViewed: true,
    createdAt: Date.now() - 1000 * 60 * 180,
  },
];

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('deals')) {
          const store = db.createObjectStore('deals', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('score', 'score', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('sourceAccount', 'sourceAccount', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id' });
          store.createIndex('receivedAt', 'receivedAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('sourceAccount', 'sourceAccount', { unique: false });
        }

        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'username' });
        }

        if (!db.objectStoreNames.contains('rules')) {
          db.createObjectStore('rules', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('purchases')) {
          const store = db.createObjectStore('purchases', { keyPath: 'id' });
          store.createIndex('preparedAt', 'preparedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        await this.ensureSeedData();
        resolve(this.db);
      };

      request.onerror = (e) => {
        reject((e.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  private async ensureSeedData() {
    const settings = await this.getSettings();
    if (!settings) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }

    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      for (const acc of DEFAULT_ACCOUNTS) {
        await this.saveAccount(acc);
      }
    }

    const rules = await this.getRules();
    if (rules.length === 0) {
      for (const rule of DEFAULT_RULES) {
        await this.saveRule(rule);
      }
    }

    const deals = await this.getDeals();
    if (deals.length === 0) {
      for (const notif of INITIAL_DEMO_NOTIFICATIONS) {
        await this.saveNotification(notif);
      }
      for (const deal of INITIAL_DEMO_DEALS) {
        await this.saveDeal(deal);
      }
    }
  }

  // --- Deals ---
  async getDeals(): Promise<Deal[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('deals', 'readonly');
      const store = tx.objectStore('deals');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as Deal[];
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getDeal(id: string): Promise<Deal | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('deals', 'readonly');
      const store = tx.objectStore('deals');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveDeal(deal: Deal): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('deals', 'readwrite');
      const store = tx.objectStore('deals');
      const request = store.put(deal);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDeal(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('deals', 'readwrite');
      const store = tx.objectStore('deals');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Notifications ---
  async getNotifications(): Promise<CapturedNotification[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as CapturedNotification[];
        results.sort((a, b) => b.receivedAt - a.receivedAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveNotification(notification: CapturedNotification): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      const request = store.put(notification);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async checkDuplicateNotification(text: string, sourceAccount: string): Promise<boolean> {
    const notifs = await this.getNotifications();
    const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
    // Check within last 24 hours
    const oneDayAgo = Date.now() - 86400000;
    return notifs.some(n => 
      n.receivedAt > oneDayAgo &&
      n.sourceAccount.toLowerCase() === sourceAccount.toLowerCase() &&
      n.rawText.toLowerCase().replace(/\s+/g, ' ').trim() === cleanText
    );
  }

  // --- Rules ---
  async getRules(): Promise<CustomRule[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readonly');
      const store = tx.objectStore('rules');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as CustomRule[]);
      request.onerror = () => reject(request.error);
    });
  }

  async saveRule(rule: CustomRule): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readwrite');
      const store = tx.objectStore('rules');
      const request = store.put(rule);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRule(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rules', 'readwrite');
      const store = tx.objectStore('rules');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Accounts ---
  async getAccounts(): Promise<XAccount[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as XAccount[]);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAccount(account: XAccount): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const request = store.put(account);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAccount(username: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const request = store.delete(username);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Purchases ---
  async getPurchases(): Promise<PurchaseRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('purchases', 'readonly');
      const store = tx.objectStore('purchases');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as PurchaseRecord[];
        results.sort((a, b) => b.preparedAt - a.preparedAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePurchase(purchase: PurchaseRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('purchases', 'readwrite');
      const store = tx.objectStore('purchases');
      const request = store.put(purchase);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key: 'current', data: settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Export, Import, Reset ---
  async exportAllData(): Promise<string> {
    const deals = await this.getDeals();
    const notifications = await this.getNotifications();
    const rules = await this.getRules();
    const accounts = await this.getAccounts();
    const purchases = await this.getPurchases();
    const settings = await this.getSettings();

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'DealHunter',
      data: {
        deals,
        notifications,
        rules,
        accounts,
        purchases,
        settings,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  async importData(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) throw new Error('Invalid DealHunter backup format');

      const { deals, notifications, rules, accounts, purchases, settings } = parsed.data;

      if (settings) await this.saveSettings(settings);
      if (Array.isArray(accounts)) {
        for (const acc of accounts) await this.saveAccount(acc);
      }
      if (Array.isArray(rules)) {
        for (const rule of rules) await this.saveRule(rule);
      }
      if (Array.isArray(notifications)) {
        for (const notif of notifications) await this.saveNotification(notif);
      }
      if (Array.isArray(deals)) {
        for (const deal of deals) await this.saveDeal(deal);
      }
      if (Array.isArray(purchases)) {
        for (const p of purchases) await this.savePurchase(p);
      }

      return {
        success: true,
        count: (deals?.length || 0) + (notifications?.length || 0),
      };
    } catch (err) {
      return {
        success: false,
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error during import',
      };
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const stores = ['deals', 'notifications', 'rules', 'accounts', 'purchases'];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      for (const s of stores) {
        tx.objectStore(s).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new LocalDatabase();
