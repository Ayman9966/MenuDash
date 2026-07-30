import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { startTelegramPolling, sendNewUserAlert, updateRestaurantPlan, getAdminChatCount } from './telegramBot';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kubesezuhxgcpoannvuq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmVzZXp1aHhnY3BvYW5udnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjU2NDcsImV4cCI6MjEwMDg0MTY0N30.5atpopWwhJuiOJHHEkXRm3yp-eIFHLisbJX4blsRdeE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Start Telegram bot polling if not already started
let pollingStarted = false;
export function initTelegram() {
  if (!pollingStarted) {
    pollingStarted = true;
    startTelegramPolling(supabase);
  }
}

export function formatRestaurant(restaurant: any) {
  if (!restaurant) return null;
  const rawPlan = restaurant.plan || 'free';
  let planExpiresAt: string | null = null;
  let effectivePlan: 'free' | 'premium' = 'free';

  if (typeof rawPlan === 'string' && rawPlan.includes(':')) {
    const parts = rawPlan.split(':');
    const planType = parts[0].toLowerCase();
    const datePart = parts[1];
    if (planType === 'pro' || planType === 'premium') {
      planExpiresAt = datePart;
    }
  } else if (rawPlan === 'premium' || rawPlan === 'pro') {
    effectivePlan = 'premium';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawPlan)) {
    planExpiresAt = rawPlan;
  }

  if (planExpiresAt) {
    const expDate = new Date(planExpiresAt + 'T23:59:59Z');
    if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now()) {
      effectivePlan = 'premium';
    } else {
      effectivePlan = 'free';
    }
  }

  return {
    ...restaurant,
    ownerId: restaurant.owner_id || restaurant.ownerId,
    whatsappNumber: restaurant.whatsapp_number || restaurant.whatsappNumber,
    logoUrl: restaurant.logo_url || restaurant.logoUrl,
    coverUrl: restaurant.cover_url || restaurant.coverUrl,
    languages: restaurant.languages || 'en',
    defaultLanguage: restaurant.default_language || restaurant.defaultLanguage || 'en',
    plan: effectivePlan,
    planExpiresAt: planExpiresAt,
    rawPlan: rawPlan
  };
}

export async function ensureUserRestaurant(user: any) {
  try {
    let restaurant = null;

    if (user.restaurant_id) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.restaurant_id)
        .maybeSingle();
      restaurant = data;
    }

    if (!restaurant) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      restaurant = data;
    }

    if (!restaurant) {
      const cleanUsername = (user.username || 'My Restaurant').trim();
      const baseSlug = cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'restaurant';
      const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 89999 + 10000)}`;

      const { data: newRest, error: restError } = await supabase
        .from('restaurants')
        .insert([{
          name: `${cleanUsername}'s Restaurant`,
          slug: uniqueSlug,
          owner_id: user.id,
          description: 'Welcome to our digital menu!',
          whatsapp_number: '',
          address: '',
          currency: 'USD',
          template: 'list'
        }])
        .select()
        .maybeSingle();

      if (!restError && newRest) {
        restaurant = newRest;
      }
    }

    if (restaurant && user.restaurant_id !== restaurant.id) {
      await supabase
        .from('users')
        .update({ restaurant_id: restaurant.id })
        .eq('id', user.id);
      user.restaurant_id = restaurant.id;
    }

    return { user, restaurant: formatRestaurant(restaurant) };
  } catch (err) {
    console.error('Error in ensureUserRestaurant:', err);
    return { user, restaurant: null };
  }
}

export async function authenticate(req: any, res: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return resolve(null);
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      resolve(decoded);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      resolve(null);
    }
  });
}

export async function superadminOnly(req: any, res: any): Promise<boolean> {
  const user = await authenticate(req, res);
  if (!user) return false;
  if (user.role !== 'superadmin') {
    res.status(403).json({ error: 'Forbidden: Superadmin access required' });
    return false;
  }
  return true;
}

export { SUPABASE_URL, JWT_SECRET, sendNewUserAlert, updateRestaurantPlan, getAdminChatCount };
