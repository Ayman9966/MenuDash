import { authenticate, supabase } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await authenticate(req, res);
  if (!user) return;

  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

  try {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.uid)
      .maybeSingle();

    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

    const { data: cat, error } = await supabase
      .from('categories')
      .insert([{
        restaurant_id: restaurant.id,
        name: name.trim(),
        order: 0
      }])
      .select()
      .maybeSingle();

    if (error) throw error;

    res.json({
      ...cat,
      restaurantId: cat.restaurant_id
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
}
