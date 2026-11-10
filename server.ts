import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory queue for incoming Android companion notifications
interface IngestedNotif {
  id: string;
  sourceAccount: string;
  title: string;
  rawText: string;
  postUrl: string | null;
  receivedAt: number;
  isSimulated: boolean;
}

const pendingNotifications: IngestedNotif[] = [];

// Initialize Gemini client server-side if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
  }
}

// 1. Android Notification Ingest Webhook
app.post('/api/notifications/ingest', (req: Request, res: Response) => {
  try {
    const { id, sourceAccount, title, rawText, postUrl, receivedAt, isSimulated } = req.body;

    if (!rawText && !title) {
      res.status(400).json({ error: 'Notification title or rawText is required' });
      return;
    }

    const notif: IngestedNotif = {
      id: id || `android-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceAccount: sourceAccount || '@XNotification',
      title: title || '',
      rawText: rawText || title || '',
      postUrl: postUrl || null,
      receivedAt: receivedAt || Date.now(),
      isSimulated: Boolean(isSimulated),
    };

    // Store in pending queue (keep up to 100 recent)
    pendingNotifications.push(notif);
    if (pendingNotifications.length > 100) {
      pendingNotifications.shift();
    }

    console.log(`[INGEST] Received notification from ${notif.sourceAccount}: "${notif.title.substring(0, 50)}"`);
    res.status(200).json({ success: true, notificationId: notif.id, queued: true });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Internal server error processing notification' });
  }
});

// 2. Poll / Consume pending notifications from Android companion
app.get('/api/notifications/pending', (req: Request, res: Response) => {
  try {
    const items = [...pendingNotifications];
    // Drain queue once client consumes it
    pendingNotifications.length = 0;
    res.json({ success: true, notifications: items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pending notifications' });
  }
});

// 3. Server-side Gemini Deal Analysis
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { notification } = req.body;
    if (!notification || (!notification.rawText && !notification.title)) {
      res.status(400).json({ error: 'Missing notification payload' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI client not initialized (GEMINI_API_KEY missing)',
        fallbackToLocal: true,
      });
      return;
    }

    const text = `${notification.title}\n${notification.rawText}`;
    const prompt = `Analyze this deal notification from X (Twitter) for a shopper:
---
${text}
---

Extract structured deal information accurately.
Rules:
- Never hallucinate prices or discounts. If unknown, leave as null.
- Identify if this is a pricing error / glitch (e.g. phrases like "price error", "glitch", "mistake", "hurry", cancel risk, or abnormally huge discount).
- Classify into one category:
  price_error, extreme_discount, regular_discount, coupon_promo, clearance, lightning_deal, freebie, cashback, general_info, not_a_deal.
- Retailer must be one of: Amazon, Walmart, Best Buy, Target, Newegg, B&H Photo, Home Depot, Costco, eBay, Other.
- Product category: Electronics, Gaming, Home & Kitchen, Computers, Apparel, Tools, Groceries, General.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert e-commerce deal analyst that extracts precise product attributes and detects pricing errors with high fidelity.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: 'Clean product name' },
            brand: { type: Type.STRING, description: 'Manufacturer brand if identifiable' },
            retailer: { type: Type.STRING, description: 'Retailer name' },
            originalPrice: { type: Type.NUMBER, description: 'Original MSRP / was price or null' },
            dealPrice: { type: Type.NUMBER, description: 'Current sale price or null' },
            discountPercentage: { type: Type.INTEGER, description: 'Calculated or stated discount %' },
            couponCode: { type: Type.STRING, description: 'Coupon/promo code if needed' },
            productUrl: { type: Type.STRING, description: 'Direct or shortened product URL' },
            isPricingGlitch: { type: Type.BOOLEAN, description: 'Whether this looks like a pricing error' },
            isLimitedTime: { type: Type.BOOLEAN, description: 'Whether this is a lightning or limited time deal' },
            category: { type: Type.STRING, description: 'One of the 10 categories' },
            productCategory: { type: Type.STRING, description: 'Product classification' },
            expirationInfo: { type: Type.STRING, description: 'Expiration details if mentioned' },
            stockStatus: { type: Type.STRING, description: 'in_stock, low_stock, out_of_stock, or unknown' },
            shippingInfo: { type: Type.STRING, description: 'Shipping details like Prime or free shipping' },
            confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
          },
          required: ['productName', 'retailer', 'isPricingGlitch', 'category'],
        },
      },
    });

    const rawJson = (response.text ?? '{}').trim();
    const analysis = JSON.parse(rawJson);

    // Approximate cost: 200 input tokens * $0.15/1M + 150 output tokens * $0.60/1M = ~$0.00004
    const costEstimate = 0.000042;

    res.json({
      success: true,
      analysis,
      modelUsed: 'gemini-3.8-flash',
      costEstimate,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'AI analysis failed',
      fallbackToLocal: true,
    });
  }
});

// 4. Lightweight Retailer URL verification
app.post('/api/verify-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      res.status(400).json({ error: 'Valid HTTP/HTTPS URL required' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const isReachable = response.status >= 200 && response.status < 400;

    res.json({
      success: true,
      statusCode: response.status,
      isReachable,
      finalUrl: response.url,
      status: isReachable ? 'verified_active' : 'expired_oos',
      message: isReachable ? 'Retailer page is accessible and active.' : `Retailer page returned status ${response.status}.`,
    });
  } catch (error) {
    res.json({
      success: false,
      isReachable: false,
      status: 'not_verified',
      message: 'Could not directly verify retailer link (may be protected or rate-limited).',
    });
  }
});

// Mount Vite or static dist
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[DEALHUNTER] Server listening on port ${PORT} (production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
