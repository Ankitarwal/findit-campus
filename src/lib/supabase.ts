import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey: string = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project') &&
    typeof supabasePublishableKey === 'string' &&
    supabasePublishableKey.trim().length > 0 &&
    !supabasePublishableKey.includes('placeholder') &&
    !supabasePublishableKey.includes('your-supabase')
  );
};

// Fallback placeholder URL/Key so createClient doesn't throw during initial build/preview without .env
const safeUrl = isSupabaseConfigured() ? supabaseUrl.trim() : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? supabasePublishableKey.trim() : 'placeholder-anon-key';

// Single reused Supabase client instance
export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Upload an item photo directly to Supabase Storage ('item-photos' or 'item-images' bucket).
 * Validates file type and 5MB size limit.
 * Returns the public URL on success or null on failure.
 */
export const uploadItemPhoto = async (file: File): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;

  // 1. Validate file size (max 5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    console.error('File size exceeds 5MB limit');
    throw new Error('Image file size must be less than 5MB');
  }

  // 2. Validate MIME type
  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    console.error('Invalid file type:', file.type);
    throw new Error('Only PNG, JPG, JPEG, and WebP images are allowed');
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    // Attempt upload to 'item-photos' first, fallback to 'item-images'
    let bucketName = 'item-photos';
    let { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError && uploadError.message.includes('Bucket not found')) {
      bucketName = 'item-images';
      const fallbackResult = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      uploadError = fallbackResult.error;
    }

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err: any) {
    console.warn('Supabase storage exception:', err?.message || err);
    return null;
  }
};
