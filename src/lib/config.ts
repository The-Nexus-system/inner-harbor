/**
 * Mosaic — Centralized Configuration
 * 
 * All environment variable access goes through this module.
 * Validates required values and provides type-safe defaults.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

export type AppEnvironment = 'development' | 'staging' | 'production';

function detectEnvironment(): AppEnvironment {
  // Explicit override via env var
  const explicit = import.meta.env.VITE_APP_ENV;
  if (explicit === 'staging' || explicit === 'production') return explicit;
  if (import.meta.env.DEV) return 'development';
  return 'production';
}

export const config = {
  supabase: {
    url: requireEnv('VITE_SUPABASE_URL'),
    anonKey: requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  },
  app: {
    url: import.meta.env.VITE_APP_URL || window.location.origin,
    name: import.meta.env.VITE_APP_NAME || 'Mosaic',
    environment: detectEnvironment(),
    isDev: import.meta.env.DEV,
    isProd: !import.meta.env.DEV,
    /** True only in production (not staging or dev) */
    isProductionDeploy: detectEnvironment() === 'production',
    /** True only in local development */
    isLocalDev: import.meta.env.DEV,
  },
} as const;

/** Whether demo data should be available (never in production deploy) */
export function isDemoDataAllowed(): boolean {
  return config.app.environment !== 'production';
}
