import { authenticate, supabase, formatRestaurant } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await authenticate(req, res);
  if (!user) return;

  const { name, slug, description, whatsappNumber, address, currency, template, languages, defaultLanguage } = req.body;
  try {
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.uid)
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
          owner_id: user.uid,
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
        .eq('id', user.uid);
    }

    res.json(formatRestaurant(restaurantData));
  } catch (error: any) {
    console.error('Save restaurant error:', error);
    const errMessage = error?.message || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || 'Failed to save restaurant';
    res.status(500).json({ error: errMessage });
  }
}
