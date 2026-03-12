

# Plan: Security Hardening, Self-Hosting Readiness, and Production Preparation

## Context

The app is currently a frontend-only React app with in-memory demo data. This plan prepares it for secure deployment and eventual self-hosting on DigitalOcean, while preserving the calm, accessible UX.

**Important constraint**: Lovable runs React frontends with Supabase (via Lovable Cloud) as the backend. The plan uses Supabase now but structures everything for portability to self-hosted Postgres later.

---

## Phase 1: Repository and Documentation Structure

Create production-ready documentation and config files:

- **`.env.example`** — Document all required environment variables (database URL, auth secrets, storage config, app URL) without real values
- **`docs/DEPLOYMENT.md`** — Step-by-step DigitalOcean deployment guide covering App Platform/Droplet setup, Postgres connection, migrations, seeding, HTTPS, and environment secrets
- **`docs/SECURITY.md`** — Security architecture notes: encryption strategy, RLS model, sensitive field handling, session management, audit logging approach
- **`docs/ACCESSIBILITY.md`** — Accessibility design decisions, testing notes, supported assistive technologies
- **Update `README.md`** — Clean project overview with setup instructions, tech stack, and links to docs
- **`scripts/seed.ts`** — Standalone seed script using the existing demo data, runnable against any Postgres instance

## Phase 2: Database Schema (via Lovable Cloud Migrations)

Enable Lovable Cloud and create a comprehensive, migration-friendly schema:

**Core tables:**
- `profiles` — user profile with display_name, avatar_url, linked to `auth.users`
- `alters` — all Alter fields, `user_id` FK, soft-delete via `archived_at`
- `front_events` — front tracking with `alter_ids text[]`, `user_id`, timestamps
- `journal_entries` — with `tags text[]`, `visibility`, `user_id`, soft-delete
- `internal_messages` — with `to_alter_ids text[]`, priority, pinned, `user_id`
- `tasks` — with assigned_to, category, recurring, `user_id`, soft-delete
- `safety_plans` — steps as `text[]`, trusted_contacts as `jsonb`, `user_id`
- `calendar_events` — with support preferences, sensory prep, `user_id`
- `daily_check_ins` — mood/stress/pain/fatigue/dissociation scales, `user_id`
- `app_settings` — per-user settings, `user_id` as PK

**Security tables:**
- `audit_log` — append-only log of sensitive actions (login, password change, data export, safety plan access). Columns: `id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at`. Insert-only RLS policy, no update/delete.
- `sessions` — optional device/session tracking for future "sign out all sessions" feature

**Schema conventions:**
- All tables have `created_at`, `updated_at` timestamps
- Foreign keys with `ON DELETE CASCADE` where appropriate
- Indexes on `user_id`, `created_at`, and frequently queried columns
- Soft-delete (`archived_at` nullable timestamp) on alters, journal entries, tasks
- `visibility` enum: `'private'`, `'shared'`, `'emergency-only'`

**RLS policies:**
- Every table: authenticated users can only CRUD rows where `user_id = auth.uid()`
- Audit log: insert-only, no update or delete
- No public read access on any table

## Phase 3: Sensitive Data Architecture

Mark and structure sensitive fields for future field-level encryption:

- Add a `sensitive_fields` documentation constant mapping tables to their high-sensitivity columns:
  - `alters`: `triggers_to_avoid`, `notes` (when visibility = private/emergency-only)
  - `safety_plans`: `steps`, `trusted_contacts`, `notes`
  - `journal_entries`: content (when type = flashback, medical, seizure, memory-reconstruction)
  - `internal_messages`: content (when visibility = private)
- Create a `src/lib/encryption.ts` utility stub with `encryptField()` / `decryptField()` functions that pass through for now but document the encryption integration point
- Add comments in the schema marking these columns for future encryption at rest

## Phase 4: Authentication

Build auth pages and session management:

- **Login page** (`/login`) — email/password with signup tab, accessible form validation, calm error messages (no alarmist language), password visibility toggle
- **Password reset** (`/reset-password`) — standard Supabase flow with `resetPasswordForEmail` and `updateUser`
- **Auth context** (`src/contexts/AuthContext.tsx`) — session state, `onAuthStateChange` listener, loading states
- **Protected routes** — redirect to `/login` if not authenticated, preserve the calm layout during redirects
- **Sign out** — clear session, redirect to login
- **Session timeout messaging** — gentle "You have been signed out for your safety" message
- **Rate limiting note** — document that Supabase handles auth rate limiting; add note in SECURITY.md about configuring stricter limits for self-hosted deployment

## Phase 5: Data Layer Refactor

Replace in-memory state with Supabase queries:

- Create React Query hooks in `src/hooks/` for each data type: `useAlters`, `useFrontEvents`, `useJournalEntries`, `useMessages`, `useTasks`, `useSafetyPlans`, `useCalendarEvents`, `useCheckIns`, `useSettings`
- Each hook handles CRUD operations via Supabase client
- Refactor `SystemContext` to use these hooks instead of local state
- Add loading skeletons using existing Skeleton component for all data-dependent views
- Add save status indicators ("Saved", "Saving...") for journal and check-in
- Add autosave for journal entries with draft recovery
- Seed demo data on first login (detect empty system, offer to populate)

## Phase 6: Health Check and Error Handling

- **Health check route** — `/health` page that verifies database connectivity (or a simple Supabase edge function returning status)
- **Error boundary** — wrap app in an accessible error boundary with calm messaging ("Something went wrong. Your data is safe.")
- **Accessible error pages** — update NotFound and add generic error page with calm language, proper heading hierarchy, and navigation back
- **Error logging structure** — `src/lib/logger.ts` utility that logs to console in dev and is ready for a hosted logging service (structured JSON format)
- **Offline tolerance** — React Query's built-in retry and stale-while-revalidate for graceful degradation

## Phase 7: Data Export Feature

User-facing export functionality:

- **Export page/modal** accessible from Settings
- Export options: journal entries, front history, tasks, safety plan, daily check-ins
- Format: plain text (`.txt`) primary, with optional JSON for data portability
- Text-first, accessible export — screen-reader friendly output
- Hospital communication card: printable/exportable view from Safety section
- All exports happen client-side from fetched data, no server-side file generation needed

## Phase 8: Build and Deployment Config

- **Production build** — verify `vite build` produces clean output, add build:prod script
- **Environment-based config** — `src/lib/config.ts` centralizing all env var access with validation
- **HTTPS enforcement** — document in DEPLOYMENT.md (handled at infrastructure level on DigitalOcean)
- **Storage abstraction** — `src/lib/storage.ts` abstracting file storage calls so Supabase Storage can be swapped for S3/DO Spaces later
- **Clean `.gitignore`** — ensure no secrets, build artifacts, or IDE files leak

## What This Does NOT Include

- Actual field-level encryption implementation (stubs only — requires a key management strategy decision)
- Passcode lock for quick re-entry (complex, better as a future feature)
- Device/session management UI (schema prepared, UI deferred)
- Haptics or native features (web-only)
- Real backup automation (documented strategy only — backups are infrastructure-level)

## Implementation Order

1. Enable Lovable Cloud
2. Database migrations (all tables + RLS + audit log)
3. Documentation files (README, DEPLOYMENT, SECURITY, ACCESSIBILITY, .env.example)
4. Auth pages + auth context + protected routes
5. Data layer hooks + SystemContext refactor
6. Loading states, autosave, error handling
7. Health check, logger, error boundary
8. Export feature
9. Config centralization + storage abstraction

