import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mpexpfuvqwstrjctjrbv.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhwZnV2cXdzdHJqY3RqcmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI4MjMsImV4cCI6MjEwNzU2ODgyM30.ru147EyJ4T06N5mED6cEqfixlVR0QwTWX9hGyXuPgDQ';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const getSupabaseBrowserClient = createClient;

