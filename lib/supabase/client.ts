import { createBrowserClient } from '@supabase/ssr';

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

  console.log('Creating client with URL:', supabaseUrl);

  return createBrowserClient(supabaseUrl, supabaseKey);
}
