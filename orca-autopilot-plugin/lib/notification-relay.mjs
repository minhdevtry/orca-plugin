import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Send notification to Desktop and configured Webhooks
 */
export async function sendNotification({
  title,
  body,
  level = 'info', // 'info' | 'success' | 'warning' | 'error'
  webhookUrl = process.env.ORCA_NOTIFY_WEBHOOK,
  orcaHost = null
}) {
  const timestamp = new Date().toLocaleTimeString()
  const fullTitle = `[Orca Fleet] ${title}`

  // 1. Orca Host Notification if available
  if (orcaHost && typeof orcaHost.call === 'function') {
    try {
      await orcaHost.call('notifications.show', {
        title: fullTitle,
        body: `${body} (${timestamp})`
      })
    } catch (e) {
      // Fallback
    }
  }

  // 2. Linux OS Native Notification (notify-send) - skip in tests to prevent popup flashes
  if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
    try {
      const urgency = level === 'error' ? 'critical' : level === 'warning' ? 'normal' : 'low'
      await execFileAsync('notify-send', ['-u', urgency, fullTitle, body])
    } catch (e) {
      // Non-fatal if notify-send is not installed
    }
  }


  // 3. Webhook (Telegram / Discord / NTFY / Slack) if configured
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fullTitle,
          message: body,
          level,
          time: timestamp
        })
      })
    } catch (e) {
      // Webhook network error is non-fatal
    }
  }

  return { success: true }
}
