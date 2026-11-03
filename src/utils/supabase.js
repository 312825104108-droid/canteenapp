import { createClient } from '@supabase/supabase-js';

let client;

export const getSupabaseClient = () => {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Student authentication is not configured. Set the Supabase project URL and publishable key.');
  }
  client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
  return client;
};
