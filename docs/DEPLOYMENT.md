# Mosaic — Deployment Guide

## Overview

Mosaic is a React + Supabase application designed for private self-hosting. This guide covers deployment to your own infrastructure.

**This is a private application.** It should not be deployed as a public-facing service.

---

## Environment Configuration

Mosaic supports three environments, controlled by `VITE_APP_ENV`:

| Environment | Value | Purpose |
|-------------|-------|---------|
| Development | `development` | Local dev, auto-detected when using `npm run dev` |
| Staging | `staging` | Pre-production testing with real data shape |
| Production | `production` | Live private deployment |

Key differences:
- **Development**: Demo data allowed, verbose logging
- **Staging**: Demo data allowed, production-like config
- **Production**: Demo data blocked, minimal logging, security hardened

---

## Pre-Deployment Checklist

Use the in-app checklist at `/deployment`, or verify manually:

- [ ] `VITE_APP_ENV=production` is set
- [ ] Email confirmation is required for signups
- [ ] Invite-only mode is enabled (or registration is disabled)
- [ ] Demo mode is off
- [ ] At least one safety plan exists
- [ ] System members are configured
- [ ] Profile (display name / system name) is set
- [ ] Database backups are configured
- [ ] All secrets are in environment variables
- [ ] HTTPS is enforced
- [ ] ICS feed URLs are private (if enabled)
- [ ] Export controls are reviewed
- [ ] Sharing settings are reviewed
- [ ] Audit logging is active

---

## Self-Hosting on DigitalOcean

### Option A: App Platform

1. **Create a DigitalOcean App**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Set run command: `npx serve dist -s` (or use a static site component)

2. **Add a Managed PostgreSQL Database**
   - Create a managed Postgres cluster in the same region
   - Note the connection string

3. **Set Environment Variables**
   - Copy values from `.env.example`
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Set `VITE_APP_ENV=production`
   - Set `DATABASE_URL` for migration scripts
   - All secrets go in App Platform's environment settings — never in code

4. **Run Migrations**
   ```bash
   psql $DATABASE_URL -f supabase/migrations/*.sql
   ```

5. **Create Your Account**
   - Visit the deployed app and create your account
   - Navigate to `/deployment` and enable invite-only or disable registration
   - Run the deployment checklist

6. **Enable HTTPS**
   - App Platform provides automatic HTTPS via Let's Encrypt
   - Add your custom domain in App Platform settings

### Option B: Droplet

1. **Create an Ubuntu droplet** (2GB+ RAM recommended)

2. **Install dependencies**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm nginx certbot
   ```

3. **Clone and build**
   ```bash
   git clone <your-repo> /opt/mosaic
   cd /opt/mosaic
   npm ci
   npm run build
   ```

4. **Set up PostgreSQL**
   ```bash
   sudo apt install -y postgresql
   sudo -u postgres createdb mosaic
   psql mosaic -f supabase/migrations/*.sql
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /opt/mosaic/dist;
       index index.html;
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

6. **Enable HTTPS**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

7. **Set environment variables** in `/opt/mosaic/.env`

8. **Lock down access**
   - Create your account, then enable invite-only or disable registration

---

## Database Backups

### Managed Postgres (recommended)
- DigitalOcean managed databases include automatic daily backups
- Configure point-in-time recovery in the DO dashboard

### Self-managed Postgres
```bash
# Daily backup cron job
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/mosaic-$(date +\%Y\%m\%d).sql.gz

# Restore
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### Attachment backups
- If using DO Spaces: enable versioning on the bucket
- If using Supabase Storage: export via the storage API

---

## Monitoring

- Use DigitalOcean's built-in monitoring for CPU, memory, disk
- Application logs go to stdout (captured by App Platform or journald on droplets)
- Database logs available in managed Postgres dashboard
- In-app audit log tracks security-relevant actions

---

## Disaster Recovery

1. Restore database from most recent backup
2. Redeploy application from GitHub
3. Verify environment variables are set
4. Run any pending migrations
5. Test authentication flow
6. Verify data integrity via the app's export feature

---

## Security Checklist

- [ ] All secrets in environment variables, not in code
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Database not publicly accessible (use private networking)
- [ ] RLS enabled on all tables
- [ ] Registration locked down (invite-only or disabled)
- [ ] Backup schedule configured
- [ ] Monitoring alerts set up
- [ ] Firewall configured (ports 80, 443 only)
- [ ] No demo data in production
- [ ] Audit log reviewed periodically

---

## Sync & Export Notes

- Sync state is per-user, tracked via `last_synced_at` timestamps
- Exports are user-initiated and require confirmation
- Supported formats: JSON, CSV
- ICS calendar feeds use private tokens — treat feed URLs as secrets
- No data is shared externally without explicit user action
