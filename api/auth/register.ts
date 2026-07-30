import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, ensureUserRestaurant, sendNewUserAlert, JWT_SECRET } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const trimmedUsername = username.trim();
  const trimmedPhone = phone ? phone.trim() : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ 
        username: trimmedUsername, 
        password: hashedPassword, 
        phone: trimmedPhone,
        role: 'owner' 
      }])
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Username or phone number already exists' });
      }
      return res.status(400).json({ error: error.message });
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user record' });
    }

    const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);

    sendNewUserAlert({
      username: updatedUser.username,
      phone: updatedUser.phone,
      userId: updatedUser.id,
      restaurantName: restaurant?.name,
      restaurantId: restaurant?.id,
      restaurantSlug: restaurant?.slug,
      createdAt: user.created_at || new Date().toISOString()
    }).catch(err => console.error('Telegram alert trigger error:', err));
    
    const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
}
