import { superadminOnly, updateRestaurantPlan, supabase } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await superadminOnly(req, res)) return;
  const { restaurantId, expireDate } = req.body;
  if (!restaurantId || !expireDate) {
    return res.status(400).json({ error: 'restaurantId and expireDate (YYYY-MM-DD or "free") are required' });
  }
  const result = await updateRestaurantPlan(supabase, restaurantId, expireDate);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
}
