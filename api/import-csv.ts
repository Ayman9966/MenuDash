import Papa from 'papaparse';
import { authenticate, supabase } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await authenticate(req, res);
  if (!user) return;

  const { csvData, items: rawItems, restaurantId } = req.body;
  if (!restaurantId) {
    return res.status(400).json({ error: 'Missing restaurant ID' });
  }
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
        const nameFr = (row.name_fr || row.Name_fr || '').toString().trim();
        const nameAr = (row.name_ar || row.Name_ar || '').toString().trim();
        const mainName = nameEn || nameFr || nameAr || '';
        if (!mainName) return;

        const key = mainName.toLowerCase();
        if (uniqueMap.has(key)) {
          duplicatesRemoved++;
          const existing = uniqueMap.get(key);
          if (nameEn && !existing.name_en) existing.name_en = nameEn;
          if (nameFr && !existing.name_fr) existing.name_fr = nameFr;
          if (nameAr && !existing.name_ar) existing.name_ar = nameAr;
        } else {
          uniqueMap.set(key, row);
        }
      });
      items = Array.from(uniqueMap.values());
    } else if (items) {
      totalRows = items.length;
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    let importedCount = 0;
    let categoryOrder = 0;

    const firstItem = items[0] || {};
    const hasFrench = Boolean(firstItem.category_fr || firstItem.Name_fr || firstItem.name_fr || firstItem.description_fr);
    const hasArabic = Boolean(firstItem.category_ar || firstItem.Name_ar || firstItem.name_ar || firstItem.description_ar);
    const hasEnglish = Boolean(firstItem.category_en || firstItem.Name_en || firstItem.name_en || firstItem.description_en || firstItem.category || firstItem.name);

    for (const item of items) {
      const categoryEn = (item.category_en || item.Category_en || item.category || item.Category || '').toString().trim();
      const categoryFr = (item.category_fr || item.Category_fr || '').toString().trim();
      const categoryAr = (item.category_ar || item.Category_ar || '').toString().trim();
      const categoryMain = categoryEn || categoryFr || categoryAr || 'General';

      const nameEn = (item.name_en || item.Name_en || item.name || item.Name || '').toString().trim();
      const nameFr = (item.name_fr || item.Name_fr || '').toString().trim();
      const nameAr = (item.name_ar || item.Name_ar || '').toString().trim();
      const nameMain = nameEn || nameFr || nameAr || '';

      const descEn = (item.description_en || item.Description_en || item.description || item.Description || '').toString().trim();
      const descFr = (item.description_fr || item.Description_fr || '').toString().trim();
      const descAr = (item.description_ar || item.Description_ar || '').toString().trim();
      const descMain = descEn || descFr || descAr || '';

      const priceRaw = (item.price || item.Price || '0').toString().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceRaw);
      const imageUrl = (item.imageUrl || item.image_url || item.Image || item.image || '').toString().trim();

      if (!nameMain || isNaN(price)) continue;

      let { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .or(`name.eq."${categoryMain}",name_en.eq."${categoryMain}",name_fr.eq."${categoryMain}",name_ar.eq."${categoryMain}"`)
        .maybeSingle();
      
      if (!cat) {
        categoryOrder += 1;
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert([{
            restaurant_id: restaurantId,
            name: categoryMain,
            name_en: categoryEn || categoryMain,
            name_fr: categoryFr,
            name_ar: categoryAr,
            order: categoryOrder
          }])
          .select()
          .maybeSingle();
        if (catErr) console.error('Cat error:', catErr);
        cat = newCat;
      } else {
        await supabase
          .from('categories')
          .update({
            name_en: categoryEn || cat.name_en || cat.name,
            name_fr: categoryFr || cat.name_fr,
            name_ar: categoryAr || cat.name_ar
          })
          .eq('id', cat.id);
      }

      if (!cat) continue;

      const { data: existingProd } = await supabase
        .from('products')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('category_id', cat.id)
        .eq('name', nameMain)
        .maybeSingle();
      
      if (!existingProd) {
        const { error: prodErr } = await supabase.from('products').insert([{
          restaurant_id: restaurantId,
          category_id: cat.id,
          name: nameMain,
          description: descMain,
          name_en: nameEn || nameMain,
          name_fr: nameFr,
          name_ar: nameAr,
          description_en: descEn || descMain,
          description_fr: descFr,
          description_ar: descAr,
          price: price || 0,
          image_url: imageUrl,
          is_available: true,
          is_featured: false
        }]);
        if (!prodErr) importedCount++;
      } else {
        const { error: prodErr } = await supabase.from('products').update({
          description: descMain,
          name_en: nameEn || nameMain,
          name_fr: nameFr,
          name_ar: nameAr,
          description_en: descEn || descMain,
          description_fr: descFr,
          description_ar: descAr,
          price: price || 0,
          image_url: imageUrl,
        }).eq('id', existingProd.id);
        if (!prodErr) importedCount++;
      }
    }

    const { data: restData } = await supabase.from('restaurants').select('languages').eq('id', restaurantId).maybeSingle();
    if (restData) {
      const currentLangs = new Set((restData.languages || 'en').split(',').map((s: string) => s.trim()).filter(Boolean));
      if (hasFrench) currentLangs.add('fr');
      if (hasArabic) currentLangs.add('ar');
      if (hasEnglish) currentLangs.add('en');
      await supabase.from('restaurants').update({ languages: Array.from(currentLangs).join(',') }).eq('id', restaurantId);
    }

    res.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} product(s)!`,
      summary: {
        totalRows: totalRows || (items.length + duplicatesRemoved),
        duplicatesRemoved,
        importedCount
      }
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message || 'Import failed' });
  }
}
