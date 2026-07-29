import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase";
import { ensureUserRestaurant } from "../utils";
import { sendNewUserAlert } from "../../../bot/telegramBot";
import { authenticate, AuthRequest } from "../auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Register
router.post("/register", async (req, res) => {
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

    sendNewUserAlert(supabase, {
      username: updatedUser.username,
      phone: updatedUser.phone,
      userId: updatedUser.id,
      restaurantName: restaurant?.name,
      restaurantId: restaurant?.id,
      restaurantSlug: restaurant?.slug,
      createdAt: user.created_at || new Date().toISOString()
    }).catch(err => console.error('Telegram alert trigger error:', err));
    
    const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post("/login", async (req, res) => {
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
    
    const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

// Me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  if (req.user.role === 'superadmin') {
    return res.json({ 
      user: { id: req.user.uid, username: req.user.username, role: 'superadmin' }, 
      restaurant: null 
    });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.uid)
      .maybeSingle();

    if (userError || !user) return res.status(404).json({ error: 'User not found' });
    
    const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);
    res.json({ user: updatedUser, restaurant });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
