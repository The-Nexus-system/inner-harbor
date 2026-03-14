# Mosaic

A private, accessible system management app for plural and dissociative systems. Built with care for privacy, accessibility, and trauma-informed design.

**This is a private application.** It is designed for secure self-hosting and controlled access, not public deployment.

## What is Mosaic?

Mosaic helps plural systems track fronting, communicate internally, journal, manage tasks, and maintain safety plans — all in one calm, private space.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Charts**: Recharts
- **Accessibility**: Atkinson Hyperlegible font, WCAG 2.1 AA target, semantic HTML

## Features

- 🧠 **Front tracking** — Log who is fronting, co-fronting, or blurry
- 📓 **Journal** — Write entries with mood, type, and tags
- 💬 **Internal messages** — Leave notes between alters
- ✅ **Tasks** — Medication, hygiene, therapy, and daily tasks
- 📅 **Calendar** — Events with sensory prep and fronter preferences
- 🛡️ **Safety plans** — Grounding, crisis, and medical plans
- 📊 **Daily check-in** — Mood, stress, pain, fatigue, dissociation tracking
- 💊 **Medications** — Track medications, dosages, and adherence
- 🎯 **Sensory profiles** — Per-alter sensory sensitivity tracking
- 🗣️ **Communication board** — AAC-friendly cards and phrases
- 🔐 **Security dashboard** — Login history, device tracking, audit log
- ♿ **Accessibility** — High contrast, large text, reduced motion, screen reader support
- 🔒 **Privacy** — Row-level security, audit logging, no public access

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

| Variable | Purpose | Client-safe? |
|----------|---------|:---:|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | ✅ |
| `VITE_APP_ENV` | `development`, `staging`, or `production` | ✅ |
| `VITE_APP_URL` | Application URL (for redirects) | ✅ |
| `DATABASE_URL` | Direct Postgres connection (server-only) | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | ❌ |

**Important:** Variables prefixed with `VITE_` are exposed to the browser. Never put private keys in `VITE_` variables.

See [.env.example](.env.example) for all options.

## Access Control

Mosaic supports three access control modes, configurable from the Deployment page (`/deployment`):

1. **Open registration** — Anyone can create an account (default, for initial setup)
2. **Invite-only** — New accounts require a valid invite code
3. **Registration disabled** — No new accounts can be created

For private use, enable invite-only or disable registration after creating your account.

## Database

- All tables have Row-Level Security (RLS) enabled
- Users can only access their own data (`auth.uid() = user_id`)
- Audit log is append-only (no update/delete)
- Migrations are in `supabase/migrations/`

### Running Migrations

```bash
# Using Supabase CLI
supabase db push

# Or directly with psql
psql $DATABASE_URL -f supabase/migrations/*.sql
```

### Seed Data (Development Only)

```bash
npx tsx scripts/seed.ts
```

Demo data in `src/data/demo-data.ts` is never imported in production code.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Self-hosting instructions
- [Security Architecture](docs/SECURITY.md) — Privacy model, encryption, audit logging
- [Accessibility Notes](docs/ACCESSIBILITY.md) — Design decisions and assistive tech support

## Privacy Model

- All data is per-user with Row-Level Security
- No public sharing unless explicitly enabled
- Sensitive fields marked for future field-level encryption
- Append-only audit log for accountability
- Three visibility levels: private, shared, emergency-only

## Deployment Checklist

Before going live, use the in-app deployment checklist (`/deployment`) or verify manually:

- [ ] Auth enabled, email confirmation required
- [ ] Invite-only or registration disabled
- [ ] Demo mode off
- [ ] System members configured
- [ ] Safety plans created
- [ ] Profile configured
- [ ] Database backups configured
- [ ] Secrets in environment variables (not in code)
- [ ] HTTPS enforced

## License

Private. Not for redistribution.
