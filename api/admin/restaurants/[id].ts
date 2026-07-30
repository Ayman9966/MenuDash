import { superadminOnly, supabase } from '../../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await superadminOnly(req, res)) return;
  try {
    const id = req.query.id || req.params?.id;
    if (!id) return res.status(400).json({ error: 'Missing restaurant id' });
    
    // Delete products first (Cascade)
    await supabase.from('products').delete().eq('restaurant_id', id);
    // Delete categories
    await supabase.from('categories').delete().eq('restaurant_id', id);
    // Delete restaurant
    const { error } = await supabase.from('restaurants').delete().eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Restaurant and all associated data deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
