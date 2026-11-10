import { CapturedNotification } from '../types';

export interface SimulationTemplate {
  sourceAccount: string;
  title: string;
  rawText: string;
  scenario: 'glitch' | 'clearance' | 'coupon' | 'expired' | 'duplicate' | 'electronics_high_discount';
}

export const SIMULATION_TEMPLATES: SimulationTemplate[] = [
  {
    sourceAccount: '@BobaDeals',
    title: '🚨 Amazon Glitch: Sony WH-1000XM5 Headphones',
    rawText: '🚨 PRICING ERROR at Amazon: Sony WH-1000XM5 Wireless Noise Canceling Headphones down to $69.99 (Retail $399.99)! 82% discount! Hurry, will fix or cancel orders immediately! amzn.to/sonyXM5Glitch',
    scenario: 'glitch',
  },
  {
    sourceAccount: '@Wario64',
    title: 'Nintendo Switch OLED Bundle at Target',
    rawText: 'Target has Nintendo Switch OLED Model w/ Mario Kart 8 Deluxe bundle dropping to $189.99 in-cart (MSRP $349.99). Limited quantity! target.com/p/switch-oled-bundle',
    scenario: 'electronics_high_discount',
  },
  {
    sourceAccount: '@FatKidDeals',
    title: 'Walmart Clearance: Dyson V12 Slim Vacuum',
    rawText: 'Walmart In-Store & Online Clearance: Dyson V12 Detect Slim Cordless Vacuum only $249.00 (was $649.99). Over $400 off while inventory lasts! walmart.com/ip/dyson-v12-clearance',
    scenario: 'clearance',
  },
  {
    sourceAccount: '@videogamedeals',
    title: 'Best Buy Coupon: LG 27" UltraGear 240Hz OLED',
    rawText: 'Best Buy has LG UltraGear 27" 240Hz QHD OLED Gaming Monitor for $499.99 after clipping $200 coupon with code OLED200 at checkout (Reg. $899.99). bestbuy.com/site/lg-ultragear-oled',
    scenario: 'coupon',
  },
  {
    sourceAccount: '@BobaDeals',
    title: '🚨 Best Buy Price Glitch: Apple Watch Ultra 2',
    rawText: '🚨 PRICE GLITCH at Best Buy: Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium) listed for $129.99 (was $799.00)! 84% OFF! Run before dead! bestbuy.com/site/apple-watch-ultra-2',
    scenario: 'glitch',
  },
  {
    sourceAccount: '@DailyDealsCentral',
    title: 'Amazon Lightning Deal: Anker 100W GaN Fast Charger',
    rawText: 'Amazon Lightning Deal: Anker Prime 100W USB-C GaN Charger $39.99 (Reg $84.99). 53% off for Prime members today only. amzn.to/anker100w',
    scenario: 'electronics_high_discount',
  },
  {
    sourceAccount: '@FatKidDeals',
    title: 'Target Clearance: Ninja Foodi 8-in-1 DualZone Air Fryer',
    rawText: 'Target Clearance Rollback: Ninja Foodi 8-in-1 8-Qt DualZone 2-Basket Air Fryer only $79.99 (was $199.99). 60% savings! target.com/p/ninja-dualzone-8qt',
    scenario: 'clearance',
  },
  {
    sourceAccount: '@Wario64',
    title: 'Expired Promo: Xbox Wireless Controller $29',
    rawText: 'Deal is now EXPIRED and Out of Stock: Microsoft Xbox Series X Wireless Controller was $29.99 (Orig $64.99) at Best Buy. Now back to regular price.',
    scenario: 'expired',
  },
];

let simCounter = 1;

export function generateSimulatedNotification(scenario?: SimulationTemplate['scenario']): CapturedNotification {
  let pool = SIMULATION_TEMPLATES;
  if (scenario) {
    pool = SIMULATION_TEMPLATES.filter((t) => t.scenario === scenario);
    if (pool.length === 0) pool = SIMULATION_TEMPLATES;
  }

  const template = pool[Math.floor(Math.random() * pool.length)];
  const id = `sim-notif-${Date.now()}-${simCounter++}`;

  return {
    id,
    sourceAccount: template.sourceAccount,
    title: template.title,
    rawText: template.rawText,
    postUrl: `https://x.com/${template.sourceAccount.replace('@', '')}/status/${1789500000000 + Math.floor(Math.random() * 999999)}`,
    receivedAt: Date.now(),
    status: 'queued',
    isSimulated: true,
    dealId: null,
  };
}

export function generateDuplicateNotification(existing: CapturedNotification): CapturedNotification {
  return {
    id: `sim-dup-${Date.now()}-${simCounter++}`,
    sourceAccount: existing.sourceAccount,
    title: existing.title,
    rawText: existing.rawText,
    postUrl: existing.postUrl,
    receivedAt: Date.now(),
    status: 'queued',
    isSimulated: true,
    dealId: null,
  };
}
