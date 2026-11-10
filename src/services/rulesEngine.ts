import { Deal, CustomRule, XAccount } from '../types';

export interface RuleEvaluationResult {
  matchedRule: CustomRule | null;
  actionTaken: 'none' | 'ignore' | 'elevated_critical' | 'notify_normal' | 'purchase_prepared';
  scoreAdjustment: number;
  reason: string | null;
}

export function evaluateCustomRules(deal: Deal, rules: CustomRule[], accounts: XAccount[]): RuleEvaluationResult {
  const activeRules = rules.filter((r) => r.enabled);

  for (const rule of activeRules) {
    const textToMatch = `${deal.product.productName} ${deal.rawNotificationText} ${deal.product.brand || ''}`.toLowerCase();

    // 1. Excluded keywords check (if found, rule doesn't match or skips)
    if (rule.excludedKeywords.length > 0) {
      const hasExcluded = rule.excludedKeywords.some((kw) => textToMatch.includes(kw.toLowerCase().trim()));
      if (hasExcluded) continue;
    }

    // 2. Included keywords check
    if (rule.includedKeywords.length > 0) {
      const hasIncluded = rule.includedKeywords.some((kw) => textToMatch.includes(kw.toLowerCase().trim()));
      if (!hasIncluded) continue;
    }

    // 3. Retailer check
    if (rule.retailers.length > 0) {
      const matchedRetailer = rule.retailers.some(
        (r) => r.toLowerCase() === deal.product.retailer.toLowerCase()
      );
      if (!matchedRetailer) continue;
    }

    // 4. Category check
    if (rule.categories.length > 0) {
      const matchedCategory = rule.categories.some(
        (c) => c.toLowerCase() === deal.product.productCategory.toLowerCase()
      );
      if (!matchedCategory) continue;
    }

    // 5. Deal types check
    if (rule.dealTypes.length > 0) {
      if (!rule.dealTypes.includes(deal.category)) continue;
    }

    // 6. Minimum discount check
    if (rule.minDiscount !== null) {
      if (!deal.product.discountPercentage || deal.product.discountPercentage < rule.minDiscount) {
        continue;
      }
    }

    // 7. Maximum price check
    if (rule.maxPrice !== null) {
      if (deal.product.dealPrice === null || deal.product.dealPrice > rule.maxPrice) {
        continue;
      }
    }

    // 8. Trusted accounts only check
    if (rule.trustedAccountsOnly) {
      const acc = accounts.find((a) => a.username.toLowerCase() === deal.sourceAccount.toLowerCase());
      if (!acc?.isTrusted) continue;
    }

    // If we passed all criteria, this rule matched!
    if (rule.action === 'ignore') {
      return {
        matchedRule: rule,
        actionTaken: 'ignore',
        scoreAdjustment: -100,
        reason: `Matched ignore rule: "${rule.name}"`,
      };
    }

    if (rule.action === 'notify_critical') {
      return {
        matchedRule: rule,
        actionTaken: 'elevated_critical',
        scoreAdjustment: 20,
        reason: `Elevated to Critical by custom rule: "${rule.name}"`,
      };
    }

    if (rule.action === 'auto_prepare_purchase') {
      return {
        matchedRule: rule,
        actionTaken: 'purchase_prepared',
        scoreAdjustment: 10,
        reason: `Auto-purchase opportunity staged by rule: "${rule.name}"`,
      };
    }

    if (rule.action === 'notify_normal') {
      return {
        matchedRule: rule,
        actionTaken: 'notify_normal',
        scoreAdjustment: 5,
        reason: `Matched custom rule: "${rule.name}"`,
      };
    }
  }

  return {
    matchedRule: null,
    actionTaken: 'none',
    scoreAdjustment: 0,
    reason: null,
  };
}
