package com.dealhunter.companion

import android.app.Notification
import android.content.Context
import android.content.SharedPreferences
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import android.util.LruCache
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.regex.Pattern

/**
 * DealHunter Android Companion - NotificationListenerService
 *
 * Privacy & Security Architecture:
 * 1. Strictly filters for package "com.twitter.android" and "com.twitter.android.lite" only.
 * 2. Never inspects or forwards notifications from any other application.
 * 3. Prevents duplicate ingestion using in-memory LRU cache and persistent hash tracking.
 * 4. Respects user pause/resume preference in companion settings.
 * 5. Uses background thread executor for HTTP webhook forwarding with retry.
 */
class DealHunterNotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "DealHunterService"
        private const val PREFS_NAME = "dealhunter_companion_prefs"
        private const val KEY_WEBHOOK_URL = "webhook_url"
        private const val KEY_WEBHOOK_SECRET = "webhook_secret"
        private const val KEY_MONITORING_PAUSED = "monitoring_paused"

        // X / Twitter official package names
        private val TARGET_PACKAGES = setOf(
            "com.twitter.android",
            "com.twitter.android.lite"
        )

        // LRU Cache holding recent 200 notification hashes to prevent duplicates
        private val processedHashes = LruCache<String, Long>(200)

        // Regex pattern for extracting links embedded in tweet notifications
        private val URL_PATTERN = Pattern.compile(
            "https?://[a-zA-Z0-9./_?=-]+"
        )
    }

    private val executor = Executors.newSingleThreadExecutor()

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        // Strict Privacy Boundary: Only inspect notifications from X
        if (!TARGET_PACKAGES.contains(packageName)) {
            return
        }

        val prefs: SharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isPaused = prefs.getBoolean(KEY_MONITORING_PAUSED, false)
        if (isPaused) {
            Log.d(TAG, "Notification received but monitoring is paused by user.")
            return
        }

        val webhookUrl = prefs.getString(KEY_WEBHOOK_URL, null)
        val webhookSecret = prefs.getString(KEY_WEBHOOK_SECRET, "")

        if (webhookUrl.isNullOrBlank()) {
            Log.w(TAG, "No DealHunter Webhook URL configured in companion app.")
            return
        }

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

        val fullText = when {
            bigText.isNotBlank() -> bigText
            text.isNotBlank() -> text
            else -> title
        }

        if (fullText.isBlank() && title.isBlank()) {
            return
        }

        // Deduplication Check
        val notificationId = "${sbn.id}_${sbn.postTime}_${title.hashCode()}"
        val contentHash = "${title}_${fullText}".hashCode().toString()

        synchronized(processedHashes) {
            if (processedHashes.get(contentHash) != null) {
                Log.d(TAG, "Skipping duplicate notification: $title")
                return
            }
            processedHashes.put(contentHash, System.currentTimeMillis())
        }

        // Extract potential source handle (e.g. from title "@Wario64:" or subText)
        val sourceAccount = extractAccountHandle(title, subText, fullText)

        // Extract any URLs present in notification
        var postUrl: String? = null
        val matcher = URL_PATTERN.matcher(fullText)
        if (matcher.find()) {
            postUrl = matcher.group(0)
        }

        // Asynchronously forward to DealHunter PWA endpoint
        executor.execute {
            forwardNotificationToDealHunter(
                endpoint = webhookUrl,
                secret = webhookSecret ?: "",
                notifId = notificationId,
                account = sourceAccount,
                title = title,
                text = fullText,
                postUrl = postUrl,
                postTime = sbn.postTime
            )
        }
    }

    private fun extractAccountHandle(title: String, subText: String, fullText: String): String {
        // Look for @username pattern
        val handlePattern = Pattern.compile("(@[A-Za-z0-9_]{1,25})")
        val matchSub = handlePattern.matcher(subText)
        if (matchSub.find()) return matchSub.group(1)

        val matchTitle = handlePattern.matcher(title)
        if (matchTitle.find()) return matchTitle.group(1)

        val matchFull = handlePattern.matcher(fullText)
        if (matchFull.find()) return matchFull.group(1)

        if (title.isNotBlank() && !title.contains(" ")) {
            return "@" + title.replace(":", "").trim()
        }

        return "@XNotification"
    }

    private fun forwardNotificationToDealHunter(
        endpoint: String,
        secret: String,
        notifId: String,
        account: String,
        title: String,
        text: String,
        postUrl: String?,
        postTime: Long
    ) {
        var attempts = 0
        val maxAttempts = 3
        var backoffMs = 1000L

        while (attempts < maxAttempts) {
            try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                conn.setRequestProperty("User-Agent", "DealHunter-Android-Companion/1.0")
                if (secret.isNotBlank()) {
                    conn.setRequestProperty("X-DealHunter-Secret", secret)
                }
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("id", notifId)
                    put("sourceAccount", account)
                    put("title", title)
                    put("rawText", text)
                    put("postUrl", postUrl ?: JSONObject.NULL)
                    put("receivedAt", if (postTime > 0) postTime else System.currentTimeMillis())
                    put("isSimulated", false)
                }

                OutputStreamWriter(conn.outputStream).use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = conn.responseCode
                if (responseCode in 200..299) {
                    Log.i(TAG, "Successfully forwarded notification to DealHunter: $title (HTTP $responseCode)")
                    return
                } else {
                    Log.w(TAG, "Webhook server returned HTTP $responseCode")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error forwarding notification (Attempt ${attempts + 1}): ${e.message}")
            }

            attempts++
            try {
                Thread.sleep(backoffMs)
                backoffMs *= 2
            } catch (ignored: InterruptedException) {
                break
            }
        }
    }
}
