

## Convert to PWA with Push Notifications

### Current State
The PWA is **already configured** — `vite-plugin-pwa` is set up with manifest, icons, offline caching, and service worker auto-update. What's missing is **push notifications** for task reminders and calendar events.

### Plan

**1. Database: Add notification preferences table**
- Create `notification_subscriptions` table: `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at` (stores Web Push subscription per device)
- Add `reminder_minutes` column to `calendar_events` (default 30) and `tasks` (default null) so users can set when to be reminded
- RLS: users can only access their own subscriptions

**2. Generate VAPID keys and store as secrets**
- Web Push requires VAPID key pair (public + private)
- Store `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` as backend secrets
- Expose the public key via an edge function or hardcode in client (public keys are safe to embed)

**3. Edge function: `push-notify`**
- Accepts a user_id + title + body + url
- Looks up all subscriptions for that user
- Sends Web Push notification using the `web-push` protocol (manual fetch to push endpoint with VAPID JWT signing — no npm packages needed in Deno)

**4. Scheduled edge function: `check-reminders`**
- Runs via `pg_cron` every minute
- Queries `calendar_events` and `tasks` where reminder time is within the current minute window
- Calls `push-notify` for each matching user

**5. Frontend: Notification permission + subscription**
- Create `src/hooks/useNotifications.ts`:
  - Request notification permission
  - Subscribe to push via service worker's `pushManager.subscribe()`
  - Save subscription to `notification_subscriptions` table
  - Provide `notificationsEnabled` state and `enableNotifications()` / `disableNotifications()` functions
- Add notification toggle to Settings page
- Show opt-in prompt on Dashboard (non-blocking, dismissible)

**6. Service worker push handler**
- Add custom service worker code via `vite-plugin-pwa`'s `injectManifest` or `workbox` configuration to handle `push` and `notificationclick` events
- On push: show notification with title, body, icon
- On click: open the app to the relevant page (calendar or tasks)

**7. UI: Reminder time picker**
- Add optional "Remind me" dropdown to `CalendarEventForm` (15 min, 30 min, 1 hour, 1 day before)
- Add optional "Remind me" dropdown to `TaskForm` (for tasks with due dates)

### Files to create/modify
- **New migration**: `notification_subscriptions` table, `reminder_minutes` columns
- **New**: `supabase/functions/push-notify/index.ts`
- **New**: `supabase/functions/check-reminders/index.ts`
- **New**: `src/hooks/useNotifications.ts`
- **New**: `public/sw-custom.js` (push event handler)
- **Edit**: `vite.config.ts` — add custom SW import for push handling
- **Edit**: `src/pages/SettingsPage.tsx` — notification toggle
- **Edit**: `src/components/forms/CalendarEventForm.tsx` — reminder picker
- **Edit**: `src/components/forms/TaskForm.tsx` — reminder picker
- **Edit**: `supabase/config.toml` — register new edge functions with `verify_jwt = false`
- **SQL insert** (not migration): pg_cron job to call `check-reminders` every minute

### Secrets needed
- `VAPID_PUBLIC_KEY` — can be generated, safe to embed in client code
- `VAPID_PRIVATE_KEY` — must stay server-side only

