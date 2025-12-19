import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
    throw new Error('Missing Supabase environment variables');
  }

  console.log('Supabase URL:', supabaseUrl);

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}
