import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://wbrktjjgimvbddeobaeq.supabase.co';
const SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indicmt0ampnaW12YmRkZW9iYWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDg4NzMsImV4cCI6MjEwMTkyNDg3M30.GJB56LUFGP4fruzBSA68IU9Hfj_tdCIxRgSSjqU3HTU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
