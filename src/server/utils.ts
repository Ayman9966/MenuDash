import { supabase } from "./supabase";

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
    console.error('CRITICAL: Error in ensureUserRestaurant:', err);
    return { user, restaurant: null };
  }
}
