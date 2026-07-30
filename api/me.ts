import { authenticate, supabase, ensureUserRestaurant } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await authenticate(req, res);
  if (!user) return;

  if (user.role === 'superadmin') {
    return res.json({ 
      user: { id: user.uid, username: user.username, role: 'superadmin' }, 
      restaurant: null 
    });
  }

  try {
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.uid)
      .maybeSingle();

    if (userError || !dbUser) return res.status(404).json({ error: 'User not found' });
    
    const { user: updatedUser, restaurant } = await ensureUserRestaurant(dbUser);

    res.json({ user: updatedUser, restaurant });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}
