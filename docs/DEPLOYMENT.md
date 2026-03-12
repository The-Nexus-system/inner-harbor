# Mosaic — Deployment Guide

## Overview

Mosaic is a React + Supabase application designed for eventual self-hosting on DigitalOcean. This guide covers both the current Lovable Cloud setup and future migration to self-hosted infrastructure.

---

## Current Setup (Lovable Cloud)

The app runs on Lovable with Supabase (Lovable Cloud) providing:
- PostgreSQL database with Row-Level Security
- Authentication (email/password)
- File storage
- Edge functions

No additional setup is needed for development — Lovable Cloud handles everything.

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
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or replace with direct Postgres if migrating off Supabase)
   - Set `DATABASE_URL` for migration scripts
   - All secrets go in App Platform's environment settings — never in code

4. **Run Migrations**
   ```bash
   # Using the migration files in supabase/migrations/
   psql $DATABASE_URL -f supabase/migrations/*.sql
   ```

5. **Seed Demo Data (optional)**
   ```bash
   npx tsx scripts/seed.ts
   ```

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
- If using Supabase Storage: use the Supabase dashboard export

---

## Monitoring

- Use DigitalOcean's built-in monitoring for CPU, memory, disk
- Application logs go to stdout (captured by App Platform or journald on droplets)
- Database logs available in managed Postgres dashboard

---

## Disaster Recovery

1. Restore database from most recent backup
2. Redeploy application from GitHub
3. Verify environment variables are set
4. Run any pending migrations
5. Test authentication flow
6. Verify data integrity via the app's export feature

---

## Security Checklist for Deployment

- [ ] All secrets in environment variables, not in code
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Database not publicly accessible (use private networking)
- [ ] RLS enabled on all tables
- [ ] Backup schedule configured
- [ ] Monitoring alerts set up
- [ ] Firewall configured (ports 80, 443 only)
