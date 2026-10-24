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
 * Upload an item photo directly to Supabase Storage 'item-photos' bucket.
 * Returns the public URL on success or null on failure.
 */
export const uploadItemPhoto = async (file: File): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('item-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('item-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Supabase storage exception:', err);
    return null;
  }
};
