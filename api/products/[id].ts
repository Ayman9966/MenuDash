import { authenticate, supabase } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  const user = await authenticate(req, res);
  if (!user) return;

  const id = req.query.id || req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing product id' });

  if (req.method === 'PUT') {
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
        .update({
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
          image_url: imageUrl,
          is_available: isAvailable,
          is_featured: isFeatured
        })
        .eq('id', id)
        .eq('restaurant_id', restaurant.id)
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
      console.error('Update product error:', error);
      res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
