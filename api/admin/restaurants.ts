import { superadminOnly, supabase, formatRestaurant } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await superadminOnly(req, res)) return;
  try {
    const { data: list, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        categories:categories(count),
        products:products(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedList = list.map(r => ({
      ...formatRestaurant(r),
      categoryCount: r.categories?.[0]?.count || 0,
      productCount: r.products?.[0]?.count || 0
    }));

    res.json(formattedList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
