# Mosaic — Security Architecture

## Overview

Mosaic handles highly sensitive personal data for plural/dissociative systems. Security is not optional — it is a core accessibility feature. This document describes the current security model and future hardening plans.

---

## Authentication

- **Provider**: Supabase Auth (email/password)
- **Session management**: JWT-based via Supabase, with `onAuthStateChange` listener
- **Password hashing**: Handled by Supabase (bcrypt with salt)
- **Rate limiting**: Supabase applies default rate limits to auth endpoints
- **Password reset**: Secure email-based flow via `resetPasswordForEmail`

### Implemented hardening
- **Session/device management UI** — view login history, active sessions, and sign out all other devices (`/security`)
- **Confirmation dialogs** — all destructive actions (delete, deactivate, revoke) require explicit user confirmation
- **Edge function auth** — all backend functions validate authorization (service-role for cron jobs, JWT for user-facing endpoints)

### Future hardening
- Login attempt throttling (configurable per-IP when self-hosting)
- Session expiration policies
- Optional quick re-entry passcode lock
- CSRF protection for state-changing operations

---

## Data Protection

### Row-Level Security (RLS)

Every table has RLS enabled. Policies enforce:
- Users can only read/write their own data (`auth.uid() = user_id`)
- Audit log is append-only (insert + select only, no update/delete)
- No public read access on any table

### Sensitive Field Mapping

The following fields contain especially sensitive data and are candidates for future field-level encryption:

| Table | Fields | Sensitivity |
|-------|--------|-------------|
| `alters` | `triggers_to_avoid`, `notes` (when private/emergency-only) | High |
| `safety_plans` | `steps`, `trusted_contacts`, `notes` | Critical |
| `journal_entries` | `content` (flashback, medical, seizure, memory-reconstruction types) | High |
| `internal_messages` | `content` (when visibility = private) | High |

### Encryption Strategy

**Current**: Data encrypted at rest by Supabase/PostgreSQL. Transport encrypted via HTTPS/TLS.

**Planned**: Field-level encryption for the fields listed above using:
- AES-256-GCM encryption
- Key management via environment secrets (future: dedicated KMS)
- Encryption/decryption handled in `src/lib/encryption.ts` (currently pass-through stubs)

---

## Audit Logging

The `audit_log` table records:
- Login events
- Password changes
- Data exports
- Safety plan access
- Settings changes
- Account-level actions

Properties:
- Append-only (no UPDATE or DELETE RLS policies)
- Indexed by user, timestamp, and action type
- Retained indefinitely (no auto-purge)

---

## Visibility Model

Data has three visibility levels:
- **`private`**: Only visible to the specific alter or creator
- **`shared`**: Visible to all members of the system
- **`emergency-only`**: Separated and clearly marked; intended for crisis situations

The distinction is enforced in the application layer and can be enhanced with RLS sub-policies.

---

## API Security

- All database queries go through Supabase client with user JWT
- Minimal data returned — no over-fetching
- No server-side endpoints expose raw SQL
- Edge functions validate auth tokens before processing

---

## Self-Hosting Security Notes

When migrating to DigitalOcean:

1. **Network**: Use private networking between app and database
2. **Firewall**: Only expose ports 80 and 443
3. **Database**: Never expose Postgres port publicly
4. **Secrets**: Use DigitalOcean's encrypted environment variables
5. **HTTPS**: Enforce via Nginx + Let's Encrypt or App Platform
6. **Backups**: Encrypt backup files at rest
7. **Updates**: Keep OS, Node.js, and PostgreSQL patched
8. **Rate limiting**: Configure at Nginx level for auth endpoints

---

## Incident Response

If a security incident is suspected:
1. Rotate all secrets (database password, JWT secret, service role key)
2. Review audit log for unauthorized access
3. Force sign-out all sessions
4. Restore from known-good backup if data integrity is compromised
5. Notify affected users
