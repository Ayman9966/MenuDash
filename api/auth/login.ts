import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, ensureUserRestaurant, JWT_SECRET } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const inputVal = username.trim();

  const SUPERADMIN_USER = process.env.SUPERADMIN_USERNAME;
  const SUPERADMIN_PASS = process.env.SUPERADMIN_PASSWORD;

  if (SUPERADMIN_USER && SUPERADMIN_PASS && inputVal === SUPERADMIN_USER && password === SUPERADMIN_PASS) {
    const superUser = {
      id: 'superadmin-id',
      username: SUPERADMIN_USER,
      role: 'superadmin'
    };
    const token = jwt.sign({ uid: superUser.id, username: superUser.username, role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ user: superUser, restaurant: null, token });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.${inputVal},phone.ilike.${inputVal}`)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid username/phone or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username/phone or password' });
    }

    const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);
    
    const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
}
