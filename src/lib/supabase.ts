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

const isServer = typeof window === 'undefined';
const supabaseKey = (isServer && SUPABASE_SERVICE_ROLE_KEY) ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;

const isKeyValid = (key: string) => key && key.length > 20 && !key.includes('YOUR_');

// Avoid crashing if credentials are missing
const validUrl = SUPABASE_URL && SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder-url.supabase.co';
const validKey = isKeyValid(supabaseKey) ? supabaseKey : 'placeholder-key';

if (!SUPABASE_URL || !isKeyValid(supabaseKey)) {
  if (!isServer) {
    console.warn('Supabase credentials missing or invalid. Check your environment variables.');
  }
}

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: !isServer,
    autoRefreshToken: !isServer,
  }
});
