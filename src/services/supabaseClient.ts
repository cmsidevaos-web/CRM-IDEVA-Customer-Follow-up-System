import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string, fallback: string): string => {
  try {
    if (typeof process !== 'undefined' && process?.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {}
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key] as string;
    }
  } catch {}
  return fallback;
};

const rawSupabaseUrl = getEnv('SUPABASE_URL', getEnv('VITE_SUPABASE_URL', 'https://wbrktjjgimvbddeobaeq.supabase.co'));
const SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = getEnv(
  'SUPABASE_ANON_KEY',
  getEnv(
    'VITE_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indicmt0ampnaW12YmRkZW9iYWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDg4NzMsImV4cCI6MjEwMTkyNDg3M30.GJB56LUFGP4fruzBSA68IU9Hfj_tdCIxRgSSjqU3HTU'
  )
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

