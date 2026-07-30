import { supabase, formatRestaurant } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = req.query.slug || req.params?.slug;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const { data: restaurant, error: resError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (resError || !restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const { data: menuCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('order', { ascending: true });
    
    const { data: menuProducts } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    const formattedRest = formatRestaurant(restaurant);

    res.json({ 
      restaurant: formattedRest, 
      categories: menuCategories?.map((c: any) => ({
        ...c,
        restaurantId: c.restaurant_id
      })) || [], 
      products: menuProducts?.map((p: any) => ({
        ...p,
        restaurantId: p.restaurant_id,
        categoryId: p.category_id,
        imageUrl: p.image_url,
        isAvailable: p.is_available ?? true,
        isFeatured: p.is_featured ?? false
      })) || []
    });
  } catch (error) {
    console.error('Fetch public menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
}
