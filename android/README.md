# DealHunter Android Companion Module

This native Android companion enables DealHunter to ingest notifications sent to your Android device by the official **X (Twitter)** app in real time.

---

## 🔒 Privacy & Architecture Principles

1. **Strict Application Filtering**: The service checks `sbn.packageName` and **only** inspects notifications from `com.twitter.android` and `com.twitter.android.lite`. All notifications from banking apps, messages, emails, and any other apps are immediately dropped and never inspected or transmitted.
2. **Local / Private Forwarding**: Notifications are forwarded via an HTTP POST payload directly to your personal DealHunter endpoint (e.g., your local network address `http://192.168.x.x:3000/api/notifications/ingest` or your hosted PWA URL `https://your-dealhunter.run.app/api/notifications/ingest`).
3. **Zero Third-Party Relays**: No middleman servers, third-party analytics, or cloud databases are involved.
4. **Duplicate Rejection**: An in-memory LRU cache prevents forwarding the same notification twice.
5. **Pause & Resume**: You can pause monitoring anytime in the app without disabling permissions.

---

## 🛠️ Setup Instructions

### Option A: Build and Run with Android Studio (Recommended)
1. Open Android Studio and create a new project with package `com.dealhunter.companion`.
2. Copy `DealHunterNotificationService.kt` into `app/src/main/java/com/dealhunter/companion/`.
3. Merge `AndroidManifest.xml` into your app's manifest.
4. Build and install the APK on your Android device:
   ```bash
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

### Option B: Using Capacitor (Alternative PWA Packaging)
If you package DealHunter using Capacitor:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```
Place `DealHunterNotificationService.kt` into `android/app/src/main/java/...` and register the service in `android/app/src/main/AndroidManifest.xml`.

---

## ⚙️ Enabling Android Notification Access

Android requires explicit user approval in system settings:
1. On your Android phone, go to **Settings** > **Apps & Notifications** > **Special App Access** > **Notification Access** (or search "Notification Access" in Settings).
2. Find **DealHunter Companion** in the list and toggle it **ON**.
3. Accept the system prompt confirming you wish to allow DealHunter to read notifications.
4. In the DealHunter Companion app, paste your DealHunter Ingestion Webhook URL:
   ```text
   https://<your-app-domain>/api/notifications/ingest
   ```
5. Enter your Webhook Secret token (found in DealHunter Settings > Android Integration).
6. Tap **Test Connection** to send a test ping.

---

## 🧪 Testing Ingestion via cURL

You can test the exact webhook endpoint right now from your terminal:
```bash
curl -X POST "http://localhost:3000/api/notifications/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccount": "@BobaDeals",
    "title": "🚨 PRICE GLITCH at Amazon!",
    "rawText": "Apple AirPods Pro 2 down to $39.99 (was $249.99) at Amazon! amzn.to/glitch",
    "postUrl": "https://x.com/BobaDeals/status/123",
    "isSimulated": false
  }'
```
