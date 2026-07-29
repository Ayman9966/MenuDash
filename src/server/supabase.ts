import { createClient } from '@supabase/supabase-js';
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const isKeyValid = (key: string) => key && key.length > 20 && !key.includes('YOUR_');

if (!SUPABASE_URL || !isKeyValid(supabaseKey)) {
  console.error('❌ ERROR: Invalid or missing Supabase credentials in server! Please check your environment variables.');
}

export const supabase = createClient(SUPABASE_URL, supabaseKey);
