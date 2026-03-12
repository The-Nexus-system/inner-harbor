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

export const config = {
  supabase: {
    url: requireEnv('VITE_SUPABASE_URL'),
    anonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
  },
  app: {
    url: import.meta.env.VITE_APP_URL || window.location.origin,
    name: import.meta.env.VITE_APP_NAME || 'Mosaic',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
} as const;
