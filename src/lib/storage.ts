/**
 * Mosaic — Storage Abstraction
 * 
 * Abstracts file storage so Supabase Storage can be swapped for
 * S3-compatible storage (DigitalOcean Spaces, MinIO, etc.) later.
 */

import { supabase } from '@/integrations/supabase/client';

export interface StorageProvider {
  upload(bucket: string, path: string, file: File): Promise<{ url: string } | { error: string }>;
  download(bucket: string, path: string): Promise<{ url: string } | { error: string }>;
  remove(bucket: string, paths: string[]): Promise<{ error?: string }>;
  getPublicUrl(bucket: string, path: string): string;
}

/**
 * Supabase Storage provider (default)
 */
export const supabaseStorage: StorageProvider = {
  async upload(bucket, path, file) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return { error: error.message };
    return { url: this.getPublicUrl(bucket, path) };
  },

  async download(bucket, path) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error || !data) return { error: error?.message || 'Failed to create download URL' };
    return { url: data.signedUrl };
  },

  async remove(bucket, paths) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error: error?.message };
  },

  getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

/**
 * Active storage provider. Swap this for a different provider when self-hosting.
 */
export const storage: StorageProvider = supabaseStorage;
