import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Hardcode to bypass any env var processing issues
  const supabaseUrl = 'https://dvlbvpnobhzzcfgosrbw.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bGJ2cG5vYm56emNmZ29zcmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODEwMjcsImV4cCI6MjA4MTY1NzAyN30.Qxmr-vABizZqNHiyk7pzzRW6BIrS--q2UA048ZHpe3o';

  console.log('Creating client with URL:', supabaseUrl);

  return createBrowserClient(supabaseUrl, supabaseKey);
}
