import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  // Try process.env (Node/Serverless)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Try import.meta.env (Vite/Client)
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {}
  return '';
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || '';
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || '';
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Check your environment variables.');
  }
}

const isServer = typeof window === 'undefined';
const supabaseKey = (isServer && SUPABASE_SERVICE_ROLE_KEY) ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: !isServer,
    autoRefreshToken: !isServer,
  }
});
