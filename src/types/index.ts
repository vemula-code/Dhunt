export type DealCategory =
  | 'price_error'
  | 'extreme_discount'
  | 'regular_discount'
  | 'coupon_promo'
  | 'clearance'
  | 'lightning_deal'
  | 'freebie'
  | 'cashback'
  | 'general_info'
  | 'not_a_deal';

export type PriorityLevel = 'critical' | 'excellent' | 'good' | 'normal' | 'low';

export type Retailer =
  | 'Amazon'
  | 'Walmart'
  | 'Best Buy'
  | 'Target'
  | 'Newegg'
  | 'B&H Photo'
  | 'Home Depot'
  | 'Costco'
  | 'eBay'
  | 'Other';

export interface ExtractedProduct {
  productName: string;
  brand: string | null;
  retailer: Retailer | string;
  originalPrice: number | null;
  dealPrice: number | null;
  discountPercentage: number | null;
  couponCode: string | null;
  productUrl: string | null;
  isPricingGlitch: boolean;
  productCategory: string;
  expirationInfo: string | null;
  stockStatus: 'in_stock' | 'low_stock' | 'unknown' | 'out_of_stock';
  shippingInfo: string | null;
  imageUrl?: string | null;
}

export interface CapturedNotification {
  id: string;
  sourceAccount: string;
  title: string;
  rawText: string;
  postUrl: string | null;
  receivedAt: number;
  status: 'queued' | 'processed' | 'duplicate' | 'failed' | 'ignored';
  isSimulated: boolean;
  dealId: string | null;
  errorMessage?: string;
}

export interface Deal {
  id: string;
  notificationId: string;
  sourceAccount: string;
  rawNotificationText: string;
  originalPostUrl: string | null;
  product: ExtractedProduct;
  category: DealCategory;
  score: number; // 0 - 100
  priority: PriorityLevel;
  scoreReasons: string[];
  aiClassified: boolean;
  aiConfidence?: number;
  aiModelUsed?: string | null;
  aiCostEstimate?: number | null;
  verificationStatus: 'not_verified' | 'verifying' | 'verified_active' | 'expired_oos' | 'price_mismatch';
  verificationDetails?: string;
  isSaved: boolean;
  isDismissed: boolean;
  isViewed: boolean;
  createdAt: number;
  userReportedIncorrect?: boolean;
  purchasePrepared?: boolean;
  matchedRuleId?: string | null;
  matchedRuleName?: string | null;
}

export interface CustomRule {
  id: string;
  name: string;
  enabled: boolean;
  retailers: string[]; // empty means all
  categories: string[]; // empty means all
  dealTypes: DealCategory[]; // empty means all
  minDiscount: number | null; // e.g. 50
  maxPrice: number | null; // e.g. 100
  trustedAccountsOnly: boolean;
  excludedKeywords: string[];
  includedKeywords: string[];
  action: 'notify_critical' | 'notify_normal' | 'auto_prepare_purchase' | 'ignore';
  createdAt: number;
}

export interface XAccount {
  username: string; // e.g. '@Wario64'
  displayName: string;
  avatarUrl?: string;
  isTrusted: boolean;
  isMuted: boolean;
  priorityModifier: number; // -20 to +20
  totalDeals: number;
  criticalDeals: number;
  notes?: string;
  lastDealAt?: number;
}

export interface PurchaseRecord {
  id: string;
  dealId: string;
  productName: string;
  retailer: string;
  price: number;
  originalPrice: number | null;
  discountPercentage: number | null;
  productUrl: string;
  preparedAt: number;
  status: 'prepared' | 'opened_retailer' | 'user_confirmed' | 'cancelled';
  confirmedAt?: number;
  notes?: string;
}

export interface ScoringWeights {
  pricingGlitch: number; // default +35
  discount80: number; // default +30
  discount60: number; // default +20
  discount40: number; // default +10
  limitedTime: number; // default +15
  coupon: number; // default +5
  trustedAccount: number; // default +10
  duplicatePenalty: number; // default -50
  expiredPenalty: number; // default -100
}

export interface AppSettings {
  autoMonitoring: boolean;
  monitoringState: 'active' | 'paused' | 'permission_missing' | 'processing_error';
  useGeminiAI: boolean;
  alertSound: boolean;
  alertVibrate: boolean;
  minNotificationPriority: PriorityLevel;
  webhookSecret: string;
  scoringWeights: ScoringWeights;
  autoPurchase: {
    enabled: boolean;
    dailySpendLimit: number;
    currentDailySpent: number;
    maxPricePerItem: number;
    minDiscount: number;
    allowedRetailers: string[];
    allowedCategories: string[];
    requireConfirmation: boolean;
  };
  theme: 'dark' | 'light';
}

export interface DealFilterOptions {
  searchQuery: string;
  category: DealCategory | 'all';
  retailer: string | 'all';
  priority: PriorityLevel | 'all';
  onlyGlitches: boolean;
  onlySaved: boolean;
  minDiscount: number;
  maxPrice: number | null;
  sortBy: 'newest' | 'score' | 'discount' | 'price_low';
}
