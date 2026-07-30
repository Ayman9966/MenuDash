import { authenticate, supabase } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.uid)
        .maybeSingle();

      if (!restaurant) {
        return res.json({ categories: [], products: [] });
      }

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order', { ascending: true });

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      res.json({
        categories: categories?.map((c: any) => ({
          ...c,
          restaurantId: c.restaurant_id
        })) || [],
        products: products?.map((p: any) => ({
          ...p,
          restaurantId: p.restaurant_id,
          categoryId: p.category_id,
          imageUrl: p.image_url,
          isAvailable: p.is_available ?? true,
          isFeatured: p.is_featured ?? false
        })) || []
      });
    } catch (error: any) {
      console.error('Fetch products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { data: product, error } = await supabase
        .from('products')
        .insert([{
          restaurant_id: restaurant.id,
          category_id: categoryId,
          name: name || nameEn || nameFr || nameAr || '',
          description: description || descriptionEn || descriptionFr || descriptionAr || '',
          name_en: nameEn || name || '',
          name_fr: nameFr || '',
          name_ar: nameAr || '',
          description_en: descriptionEn || description || '',
          description_fr: descriptionFr || '',
          description_ar: descriptionAr || '',
          price: parseFloat(price) || 0,
          image_url: imageUrl || '',
          is_available: isAvailable !== false,
          is_featured: isFeatured === true
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      res.json({
        ...product,
        restaurantId: product.restaurant_id,
        categoryId: product.category_id,
        imageUrl: product.image_url,
        isAvailable: product.is_available,
        isFeatured: product.is_featured,
        nameEn: product.name_en,
        nameFr: product.name_fr,
        nameAr: product.name_ar,
        descriptionEn: product.description_en,
        descriptionFr: product.description_fr,
        descriptionAr: product.description_ar
      });
    } catch (error: any) {
      console.error('Create product error:', error);
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
