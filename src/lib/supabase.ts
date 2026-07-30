import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://kubesezuhxgcpoannvuq.supabase.co';
// @ts-ignore
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmVzZXp1aHhnY3BvYW5udnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjU2NDcsImV4cCI6MjEwMDg0MTY0N30.5atpopWwhJuiOJHHEkXRm3yp-eIFHLisbJX4blsRdeE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
