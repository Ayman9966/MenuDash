import { authenticate, supabase } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await authenticate(req, res);
  if (!user) return;

  const id = req.query.id || req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing category id' });

  try {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.uid)
      .maybeSingle();

    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurant.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
}
