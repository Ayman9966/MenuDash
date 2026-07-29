import { Router } from "express";
import Papa from "papaparse";
import { supabase } from "../supabase";
import { formatRestaurant } from "../utils";
import { authenticate, AuthRequest } from "../auth";

const router = Router();

// Public Menu Route
router.get("/menu/:slug", async (req, res) => {
  const { slug } = req.params;
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
});

// Authenticated Routes
router.use(authenticate);

// Create/Update restaurant
router.post("/", async (req: AuthRequest, res) => {
  const { name, slug, description, whatsappNumber, address, currency, template, languages, defaultLanguage } = req.body;
  try {
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.user.uid)
      .maybeSingle();
    
    if (slug) {
      const { data: slugCheck } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugCheck && (!existing || slugCheck.id !== existing.id)) {
        return res.status(400).json({ error: 'This menu URL slug is already taken by another restaurant. Please choose a different one.' });
      }
    }

    let restaurantData;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('restaurants')
        .update({ 
          name, 
          slug, 
          description, 
          whatsapp_number: whatsappNumber, 
          address, 
          currency, 
          template,
          languages: languages || 'en',
          default_language: defaultLanguage || 'en'
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      restaurantData = updated;
    } else {
      const { data: created, error } = await supabase
        .from('restaurants')
        .insert([{
          name,
          slug,
          owner_id: req.user.uid,
          description,
          whatsapp_number: whatsappNumber,
          address,
          currency,
          template,
          languages: languages || 'en',
          default_language: defaultLanguage || 'en'
        }])
        .select()
        .maybeSingle();
      if (error) throw error;
      restaurantData = created;
    }

    if (restaurantData) {
      await supabase
        .from('users')
        .update({ restaurant_id: restaurantData.id })
        .eq('id', req.user.uid);
    }

    res.json(formatRestaurant(restaurantData));
  } catch (error: any) {
    console.error('Save restaurant error:', error);
    res.status(500).json({ error: error.message || 'Failed to save restaurant' });
  }
});

// Products & Categories
router.get("/products", async (req: AuthRequest, res) => {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.user.uid)
      .maybeSingle();

    if (!restaurant) return res.json({ categories: [], products: [] });

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
      categories: categories?.map((c: any) => ({ ...c, restaurantId: c.restaurant_id })) || [],
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
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post("/products", async (req: AuthRequest, res) => {
  const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
  try {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', req.user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

    const { data: product, error } = await supabase.from('products').insert([{
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
    }]).select().maybeSingle();

    if (error) throw error;
    res.json({
      ...product,
      restaurantId: product.restaurant_id,
      categoryId: product.category_id,
      imageUrl: product.image_url,
      isAvailable: product.is_available,
      isFeatured: product.is_featured
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/products/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
  try {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', req.user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

    const { data: product, error } = await supabase.from('products').update({
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
    }).eq('id', id).eq('restaurant_id', restaurant.id).select().maybeSingle();

    if (error) throw error;
    res.json({
      ...product,
      restaurantId: product.restaurant_id,
      categoryId: product.category_id,
      imageUrl: product.image_url,
      isAvailable: product.is_available,
      isFeatured: product.is_featured
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/products/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', req.user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });
    const { error } = await supabase.from('products').delete().eq('id', id).eq('restaurant_id', restaurant.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/categories", async (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
  try {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', req.user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });
    const { data: cat, error } = await supabase.from('categories').insert([{
      restaurant_id: restaurant.id,
      name: name.trim(),
      order: 0
    }]).select().maybeSingle();
    if (error) throw error;
    res.json({ ...cat, restaurantId: cat.restaurant_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/categories/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', req.user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('restaurant_id', restaurant.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/import-csv", async (req: AuthRequest, res) => {
  const { csvData, items: rawItems, restaurantId } = req.body;
  if (!restaurantId) return res.status(400).json({ error: 'Missing restaurant ID' });
  try {
    let items = rawItems;
    let totalRows = 0;
    let duplicatesRemoved = 0;

    if (!items && csvData) {
      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
      const rawRows = parsed.data as any[];
      totalRows = rawRows.length;
      const uniqueMap = new Map<string, any>();
      rawRows.forEach(row => {
        const nameEn = (row.name_en || row.Name_en || row.name || row.Name || '').toString().trim();
        const mainName = nameEn || row.name_fr || row.name_ar || '';
        if (!mainName) return;
        const key = mainName.toLowerCase();
        if (uniqueMap.has(key)) {
          duplicatesRemoved++;
        } else {
          uniqueMap.set(key, row);
        }
      });
      items = Array.from(uniqueMap.values());
    } else if (items) {
      totalRows = items.length;
    }

    if (!items || items.length === 0) return res.status(400).json({ error: 'File is empty or could not be parsed' });

    let importedCount = 0;
    let categoryOrder = 0;
    const firstItem = items[0] || {};
    const hasFrench = Boolean(firstItem.category_fr || firstItem.name_fr);
    const hasArabic = Boolean(firstItem.category_ar || firstItem.name_ar);
    const hasEnglish = Boolean(firstItem.category_en || firstItem.name_en || firstItem.category || firstItem.name);

    for (const item of items) {
      const categoryEn = (item.category_en || item.category || '').toString().trim();
      const categoryFr = (item.category_fr || '').toString().trim();
      const categoryAr = (item.category_ar || '').toString().trim();
      const categoryMain = categoryEn || categoryFr || categoryAr || 'General';

      const nameEn = (item.name_en || item.name || '').toString().trim();
      const nameFr = (item.name_fr || '').toString().trim();
      const nameAr = (item.name_ar || '').toString().trim();
      const nameMain = nameEn || nameFr || nameAr || '';

      const priceRaw = (item.price || '0').toString().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceRaw);
      const imageUrl = (item.imageUrl || item.image_url || '').toString().trim();

      if (!nameMain || isNaN(price)) continue;

      let { data: cat } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).eq('name', categoryMain).maybeSingle();
      if (!cat) {
        categoryOrder++;
        const { data: newCat } = await supabase.from('categories').insert([{
          restaurant_id: restaurantId,
          name: categoryMain,
          name_en: categoryEn || categoryMain,
          name_fr: categoryFr,
          name_ar: categoryAr,
          order: categoryOrder
        }]).select().maybeSingle();
        cat = newCat;
      }

      if (!cat) continue;

      const { data: existingProd } = await supabase.from('products').select('id').eq('restaurant_id', restaurantId).eq('category_id', cat.id).eq('name', nameMain).maybeSingle();
      if (!existingProd) {
        await supabase.from('products').insert([{
          restaurant_id: restaurantId,
          category_id: cat.id,
          name: nameMain,
          price: price || 0,
          image_url: imageUrl,
          is_available: true,
          is_featured: false
        }]);
        importedCount++;
      } else {
        await supabase.from('products').update({ price, image_url: imageUrl }).eq('id', existingProd.id);
        importedCount++;
      }
    }

    res.json({ success: true, message: `Successfully imported ${importedCount} product(s)!` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
