/**
 * Mosaic — Database Seed Script
 * 
 * Seeds demo data for a specific user. Run against a Postgres database:
 * 
 *   DATABASE_URL=postgresql://... USER_ID=<uuid> npx tsx scripts/seed.ts
 * 
 * This script uses the demo data from src/data/demo-data.ts as a reference.
 * For Lovable Cloud, seeding happens in-app on first login (see SystemContext).
 */

// This is a reference seed script for self-hosted deployment.
// In the Lovable Cloud environment, demo data seeding is handled
// by the application itself when a new user signs up and has no data.

console.log(`
Mosaic Seed Script
==================

This script is intended for self-hosted deployments.
To seed demo data, you will need:

1. A running PostgreSQL database with the Mosaic schema applied
2. A user account created via the auth system
3. The user's UUID

Usage:
  DATABASE_URL=postgresql://user:pass@host:5432/mosaic \\
  USER_ID=<user-uuid> \\
  npx tsx scripts/seed.ts

The seed data matches the demo data used during development.
See src/data/demo-data.ts for the reference dataset.
`);

// When implementing for self-hosted:
// 1. Import demo data from src/data/demo-data.ts
// 2. Connect to DATABASE_URL using pg or postgres.js
// 3. Insert each entity with the provided USER_ID
// 4. Handle conflicts gracefully (upsert)
