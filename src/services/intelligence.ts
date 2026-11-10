import { Deal, DealCategory, PriorityLevel, ExtractedProduct, ScoringWeights, CapturedNotification, XAccount } from '../types';

export interface ParseResult {
  product: ExtractedProduct;
  category: DealCategory;
  score: number;
  priority: PriorityLevel;
  scoreReasons: string[];
  aiClassified: boolean;
  aiConfidence?: number;
  aiModelUsed?: string | null;
  aiCostEstimate?: number | null;
}

export const CATEGORY_LABELS: Record<DealCategory, { label: string; color: string; bg: string }> = {
  price_error: { label: 'Price Glitch / Error', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  extreme_discount: { label: 'Extreme Discount (>70%)', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  regular_discount: { label: 'Regular Discount', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  coupon_promo: { label: 'Coupon / Promo Code', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  clearance: { label: 'Clearance', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  lightning_deal: { label: 'Lightning / Limited Time', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  freebie: { label: '100% Free / Freebie', color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30' },
  cashback: { label: 'Cashback / Rewards', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  general_info: { label: 'Shopping Info', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
  not_a_deal: { label: 'Not a Deal', color: 'text-zinc-500', bg: 'bg-zinc-500/15 border-zinc-500/30' },
};

export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; min: number; max: number; badgeColor: string }> = {
  critical: { label: 'Critical', min: 90, max: 100, badgeColor: 'bg-rose-600 text-white shadow-rose-900/50 shadow-sm' },
  excellent: { label: 'Excellent', min: 75, max: 89, badgeColor: 'bg-amber-500 text-slate-950 font-semibold' },
  good: { label: 'Good', min: 50, max: 74, badgeColor: 'bg-blue-600 text-white' },
  normal: { label: 'Normal', min: 25, max: 49, badgeColor: 'bg-slate-700 text-slate-200' },
  low: { label: 'Low', min: 0, max: 24, badgeColor: 'bg-slate-800 text-slate-400' },
};

export function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'normal';
  return 'low';
}

// Fast local rule-based extractor with Regex & Pattern Matching
export function extractDealLocally(
  notification: CapturedNotification,
  trustedAccounts: XAccount[],
  weights: ScoringWeights
): ParseResult {
  const text = `${notification.title} ${notification.rawText}`;
  const lower = text.toLowerCase();

  // 1. Detect Pricing Glitch
  const glitchKeywords = [
    'price error',
    'pricing error',
    'price glitch',
    'pricing glitch',
    'glitch',
    'mistake',
    'price mistake',
    'misprice',
    'hurry price',
    'cancel risk',
    'run!',
    'run ',
    'hurry!',
  ];
  const isPricingGlitch = glitchKeywords.some((kw) => lower.includes(kw));

  // 2. Detect Retailer
  let retailer = 'Other';
  if (/amazon|amzn\.to|prime/i.test(text)) retailer = 'Amazon';
  else if (/walmart|walmart\.com/i.test(text)) retailer = 'Walmart';
  else if (/best buy|bestbuy\.com/i.test(text)) retailer = 'Best Buy';
  else if (/target|target\.com/i.test(text)) retailer = 'Target';
  else if (/newegg|newegg\.com/i.test(text)) retailer = 'Newegg';
  else if (/b&h|bhphotovideo/i.test(text)) retailer = 'B&H Photo';
  else if (/home depot|homedepot/i.test(text)) retailer = 'Home Depot';
  else if (/costco|costco\.com/i.test(text)) retailer = 'Costco';
  else if (/ebay|ebay\.com/i.test(text)) retailer = 'eBay';

  // 3. Extract URLs
  const urlMatch = text.match(/https?:\/\/[^\s]+/i) || text.match(/(amzn\.to|walmart\.com|bestbuy\.com|target\.com)[^\s]+/i);
  let productUrl: string | null = urlMatch ? urlMatch[0] : null;
  if (productUrl && !productUrl.startsWith('http')) {
    productUrl = 'https://' + productUrl;
  }

  // 4. Extract Prices
  let dealPrice: number | null = null;
  let originalPrice: number | null = null;

  // Patterns like "$49.99 (was $249.99)", "down to $39.99 (Reg. $249)", "$298.00 (was $798.00)"
  const priceMatches = Array.from(text.matchAll(/\$([0-9]{1,4}(?:\.[0-9]{2})?)/g)).map((m) => parseFloat(m[1]));

  if (priceMatches.length >= 2) {
    if (lower.includes('was') || lower.includes('reg') || lower.includes('retail') || lower.includes('orig')) {
      const sorted = [...priceMatches].sort((a, b) => a - b);
      dealPrice = sorted[0];
      originalPrice = sorted[sorted.length - 1];
    } else {
      dealPrice = priceMatches[0];
      originalPrice = priceMatches[1];
    }
  } else if (priceMatches.length === 1) {
    dealPrice = priceMatches[0];
  }

  // 5. Discount percentage
  let discountPercentage: number | null = null;
  const discountMatch = text.match(/([0-9]{1,2})%\s*(?:off|discount|savings)/i);
  if (discountMatch) {
    discountPercentage = parseInt(discountMatch[1], 10);
  } else if (dealPrice !== null && originalPrice !== null && originalPrice > dealPrice && originalPrice > 0) {
    discountPercentage = Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
  }

  // 6. Coupon code
  let couponCode: string | null = null;
  const couponMatch = text.match(/(?:code|coupon|promo code)[\s:]+([A-Z0-9_\-]{3,20})/i);
  if (couponMatch) {
    couponCode = couponMatch[1];
  } else if (lower.includes('clip coupon') || lower.includes('clip the coupon') || lower.includes('on-page coupon')) {
    couponCode = 'Clip on-page coupon';
  }

  // 7. Product Category & Brand Detection
  let productCategory = 'General';
  let brand: string | null = null;

  if (/apple|airpods|ipad|iphone|macbook|mac/i.test(text)) {
    brand = 'Apple';
    productCategory = 'Electronics';
  } else if (/sony|playstation|ps5|dualsense|bravia/i.test(text)) {
    brand = 'Sony';
    productCategory = lower.includes('tv') ? 'Electronics' : 'Gaming';
  } else if (/samsung|galaxy|990 pro|evo|oled/i.test(text)) {
    brand = 'Samsung';
    productCategory = lower.includes('ssd') || lower.includes('nvme') ? 'Computers' : 'Electronics';
  } else if (/nintendo|switch|mario|zelda/i.test(text)) {
    brand = 'Nintendo';
    productCategory = 'Gaming';
  } else if (/xbox|microsoft/i.test(text)) {
    brand = 'Microsoft';
    productCategory = 'Gaming';
  } else if (/kitchenaid|ninja|instant pot|dyson|vacuum/i.test(text)) {
    brand = 'KitchenAid';
    productCategory = 'Home & Kitchen';
  } else if (/ssd|gpu|rtx|ram|cpu|amd|intel|laptop/i.test(text)) {
    productCategory = 'Computers';
  } else if (/hoodie|shoes|sneakers|jacket|shirt|pants/i.test(text)) {
    productCategory = 'Apparel';
  }

  // Clean Product Name extraction
  let productName = notification.title;
  // If title is generic ("PRICE GLITCH at Amazon", clean it up from text)
  if (productName.length < 15 || /deal|glitch|alert|sale/i.test(productName)) {
    // Look for product noun phrases
    const cleanChunk = notification.rawText
      .replace(/🚨|🔥|⚡|💥|👉|\[.*?\]|\(.*?\)/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/(?:down to|only|for|sale for|was)\s+\$[0-9.]+/gi, '')
      .replace(/(?:at Amazon|at Walmart|at Best Buy|at Target)/gi, '')
      .replace(/(?:PRICE GLITCH|CLEARANCE|DEAL|HOT DEAL):?/gi, '')
      .trim();

    const firstSentence = cleanChunk.split(/[.!\n]/)[0].trim();
    if (firstSentence.length > 5) {
      productName = firstSentence.substring(0, 80);
    }
  }

  // 8. Assign Category
  let category: DealCategory = 'regular_discount';
  if (isPricingGlitch) {
    category = 'price_error';
  } else if (lower.includes('100% off') || lower.includes('free after') || lower.includes('freebie') || (dealPrice === 0)) {
    category = 'freebie';
  } else if (discountPercentage && discountPercentage >= 70) {
    category = 'extreme_discount';
  } else if (lower.includes('clearance')) {
    category = 'clearance';
  } else if (couponCode !== null) {
    category = 'coupon_promo';
  } else if (lower.includes('lightning') || lower.includes('limited time') || lower.includes('ends in')) {
    category = 'lightning_deal';
  } else if (lower.includes('cashback') || lower.includes('cash back') || lower.includes('points back')) {
    category = 'cashback';
  } else if (!dealPrice && !discountPercentage && !productUrl) {
    category = 'general_info';
  }

  // Stock status
  let stockStatus: 'in_stock' | 'low_stock' | 'unknown' | 'out_of_stock' = 'unknown';
  if (lower.includes('low stock') || lower.includes('almost gone') || lower.includes('while supplies last') || lower.includes('few left')) {
    stockStatus = 'low_stock';
  } else if (lower.includes('out of stock') || lower.includes('sold out')) {
    stockStatus = 'out_of_stock';
  } else if (dealPrice) {
    stockStatus = 'in_stock';
  }

  // Expiration info
  let expirationInfo: string | null = null;
  if (isPricingGlitch) expirationInfo = 'Urgent: Pricing glitch can be revoked immediately';
  else if (category === 'lightning_deal') expirationInfo = 'Limited-time deal';
  else if (lower.includes('today only')) expirationInfo = 'Valid today only';

  // Shipping
  let shippingInfo: string | null = null;
  if (retailer === 'Amazon') shippingInfo = 'Free Prime Shipping';
  else if (lower.includes('free shipping')) shippingInfo = 'Free Shipping';
  else if (lower.includes('free pickup') || lower.includes('store pickup')) shippingInfo = 'Free Store Pickup';

  // 9. Scoring Engine (0 - 100)
  let score = 25; // baseline
  const scoreReasons: string[] = ['Base deal detection (+25)'];

  // Pricing glitch bonus
  if (isPricingGlitch) {
    score += weights.pricingGlitch;
    scoreReasons.push(`Potential pricing glitch identified (+${weights.pricingGlitch})`);
  }

  // Discount tier bonus
  if (discountPercentage !== null) {
    if (discountPercentage >= 80) {
      score += weights.discount80;
      scoreReasons.push(`Extreme discount (${discountPercentage}% ≥ 80%) (+${weights.discount80})`);
    } else if (discountPercentage >= 60) {
      score += weights.discount60;
      scoreReasons.push(`Major discount (${discountPercentage}% ≥ 60%) (+${weights.discount60})`);
    } else if (discountPercentage >= 40) {
      score += weights.discount40;
      scoreReasons.push(`Solid discount (${discountPercentage}% ≥ 40%) (+${weights.discount40})`);
    }
  }

  // Limited time
  if (category === 'lightning_deal' || lower.includes('limited time')) {
    score += weights.limitedTime;
    scoreReasons.push(`Limited-time / lightning window (+${weights.limitedTime})`);
  }

  // Coupon
  if (couponCode) {
    score += weights.coupon;
    scoreReasons.push(`Active coupon available (+${weights.coupon})`);
  }

  // Trusted account check
  const sourceAcc = trustedAccounts.find(
    (a) => a.username.toLowerCase() === notification.sourceAccount.toLowerCase()
  );
  if (sourceAcc?.isTrusted) {
    score += weights.trustedAccount + (sourceAcc.priorityModifier || 0);
    scoreReasons.push(`Known trusted deal hunter ${sourceAcc.username} (+${weights.trustedAccount})`);
  }

  // Dollar savings value bonus
  if (originalPrice && dealPrice && (originalPrice - dealPrice >= 100)) {
    score += 10;
    scoreReasons.push(`High absolute savings ($${Math.round(originalPrice - dealPrice)} off) (+10)`);
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));
  const priority = getPriorityLevel(score);

  return {
    product: {
      productName,
      brand,
      retailer,
      originalPrice,
      dealPrice,
      discountPercentage,
      couponCode,
      productUrl,
      isPricingGlitch,
      productCategory,
      expirationInfo,
      stockStatus,
      shippingInfo,
    },
    category,
    score,
    priority,
    scoreReasons,
    aiClassified: false,
    aiConfidence: 0.88,
    aiModelUsed: 'local-regex-nlp',
    aiCostEstimate: 0,
  };
}

// Server-side Gemini AI enhanced extraction
export async function extractDealWithAI(
  notification: CapturedNotification,
  trustedAccounts: XAccount[],
  weights: ScoringWeights
): Promise<ParseResult> {
  try {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification: {
          title: notification.title,
          rawText: notification.rawText,
          sourceAccount: notification.sourceAccount,
          postUrl: notification.postUrl,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`AI server responded with ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.analysis) {
      throw new Error('AI analysis payload malformed');
    }

    const ai = data.analysis;
    const isPricingGlitch = Boolean(ai.isPricingGlitch);

    // Calculate score using the same rigorous weights
    let score = 25;
    const scoreReasons: string[] = ['AI deal intelligence analysis (+25)'];

    if (isPricingGlitch) {
      score += weights.pricingGlitch;
      scoreReasons.push(`AI verified potential pricing glitch (+${weights.pricingGlitch})`);
    }

    const discount = ai.discountPercentage;
    if (discount !== null && discount !== undefined) {
      if (discount >= 80) {
        score += weights.discount80;
        scoreReasons.push(`Extreme discount (${discount}% ≥ 80%) (+${weights.discount80})`);
      } else if (discount >= 60) {
        score += weights.discount60;
        scoreReasons.push(`Major discount (${discount}% ≥ 60%) (+${weights.discount60})`);
      } else if (discount >= 40) {
        score += weights.discount40;
        scoreReasons.push(`Solid discount (${discount}% ≥ 40%) (+${weights.discount40})`);
      }
    }

    if (ai.category === 'lightning_deal' || ai.isLimitedTime) {
      score += weights.limitedTime;
      scoreReasons.push(`Limited-time window (+${weights.limitedTime})`);
    }

    if (ai.couponCode) {
      score += weights.coupon;
      scoreReasons.push(`Coupon stack verified (+${weights.coupon})`);
    }

    const sourceAcc = trustedAccounts.find(
      (a) => a.username.toLowerCase() === notification.sourceAccount.toLowerCase()
    );
    if (sourceAcc?.isTrusted) {
      score += weights.trustedAccount + (sourceAcc.priorityModifier || 0);
      scoreReasons.push(`Known trusted deal source ${sourceAcc.username} (+${weights.trustedAccount})`);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const priority = getPriorityLevel(score);

    return {
      product: {
        productName: ai.productName || notification.title,
        brand: ai.brand || null,
        retailer: ai.retailer || 'Other',
        originalPrice: typeof ai.originalPrice === 'number' ? ai.originalPrice : null,
        dealPrice: typeof ai.dealPrice === 'number' ? ai.dealPrice : null,
        discountPercentage: typeof ai.discountPercentage === 'number' ? ai.discountPercentage : null,
        couponCode: ai.couponCode || null,
        productUrl: ai.productUrl || notification.postUrl,
        isPricingGlitch,
        productCategory: ai.productCategory || 'General',
        expirationInfo: ai.expirationInfo || null,
        stockStatus: ai.stockStatus || 'unknown',
        shippingInfo: ai.shippingInfo || null,
      },
      category: ai.category || 'regular_discount',
      score,
      priority,
      scoreReasons,
      aiClassified: true,
      aiConfidence: ai.confidence || 0.95,
      aiModelUsed: data.modelUsed || 'gemini-3.8-flash',
      aiCostEstimate: data.costEstimate || 0.00004,
    };
  } catch (error) {
    console.warn('AI extraction fallback to local rule engine:', error);
    return extractDealLocally(notification, trustedAccounts, weights);
  }
}
